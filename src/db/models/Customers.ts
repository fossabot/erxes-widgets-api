import * as mongoose from 'mongoose';
import * as Random from 'meteor-random';
import { mutateAppApi } from '../../utils';

const LocationSchema = new mongoose.Schema(
  {
    remoteAddress: String,
    country: String,
    city: String,
    region: String,
    hostname: String,
    language: String,
    userAgent: String,
  },
  { _id: false },
);

const VisitorContactSchema = new mongoose.Schema(
  {
    email: String,
    phone: String,
  },
  { _id: false },
);

const CustomerSchema = new mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: () => Random.id(),
  },
  integrationId: String,
  email: String,
  phone: String,
  isUser: Boolean,
  firstName: String,
  lastName: String,
  createdAt: Date,
  lastSeenAt: Date,
  messengerData: Object,
  companyIds: [String],
  description: String,

  location: LocationSchema,

  // if customer is not a user then we will contact with this visitor using
  // this information
  visitorContactInfo: VisitorContactSchema,

  urlVisits: Object,
});

class Customer {
  /**
   * Get customer
   * @param  {Object} customData - Customer customData from widget
   * @param  {Object} doc - Customer basic info fields
   * @return {Promise} Updated customer fields
   */
  static assignFields(customData, doc) {
    // Setting customData fields to customer fields
    Object.keys(customData).forEach(key => {
      if (key === 'first_name' || key === 'firstName') {
        doc.firstName = customData[key];

        delete customData[key];
      }

      if (key === 'last_name' || key === 'lastName') {
        doc.lastName = customData[key];

        delete customData[key];
      }

      if (key === 'bio' || key === 'description') {
        doc.description = customData[key];

        delete customData[key];
      }
    });

    return doc;
  }

  /**
   * Get customer
   * @param  {String} integrationId
   * @param  {String} email
   * @return {Promise} Existing customer object
   */
  static getCustomer({ email, phone, cachedCustomerId }) {
    if (email) {
      return Customers.findOne({ email });
    }

    if (phone) {
      return Customers.findOne({ phone });
    }

    if (cachedCustomerId) {
      return Customers.findOne({ _id: cachedCustomerId });
    }

    return null;
  }

  /**
   * Create a new customer
   * @param  {Object} doc Customer object without computational fields
   * @return {Promise} Newly created customer object
   */
  static async createCustomer(doc) {
    const customer = await Customers.create({
      ...doc,
      createdAt: new Date(),
    });

    // call app api's create customer log
    mutateAppApi(`
      mutation {
        activityLogsAddCustomerLog(_id: "${customer._id}") {
          _id
        }
      }`);

    return customer;
  }

  /**
   * Create a new messenger customer
   * @param  {Object} doc - Customer object without computational fields
   * @param  {Object} customData - plan, domain etc ...
   * @return {Promise} Newly created customer object
   */
  static async createMessengerCustomer(doc, customData) {
    doc.messengerData = {
      lastSeenAt: new Date(),
      isActive: true,
      sessionCount: 1,
      customData: customData,
    };

    this.assignFields(customData || {}, doc);

    return this.createCustomer(doc);
  }

  /**
   * Update messenger customer data
   * @param  {Object} _id - Customer id
   * @param  {Object} doc - Customer object without computational fields
   * @param  {Object} customData - plan, domain etc ...
   * @return {Promise} - updated customer
   */
  static async updateMessengerCustomer(_id, doc, customData) {
    doc['messengerData.customData'] = customData;

    this.assignFields(customData || {}, doc);

    await Customers.findByIdAndUpdate(_id, { $set: doc });

    return Customers.findOne({ _id });
  }

  /**
   * Get or create customer
   * @param  {Object} doc Expected customer object
   * @return {Promise} Existing or newly created customer object
   */
  static async getOrCreateCustomer(doc) {
    const customer = await this.getCustomer(doc);

    if (customer) {
      return customer;
    }

    return this.createCustomer(doc);
  }

  /**
   * Mark customer as active
   * @param  {String} customerId
   * @return {Promise} Updated customer
   */
  static async markCustomerAsActive(customerId) {
    await Customers.update({ _id: customerId }, { $set: { 'messengerData.isActive': true } });

    return Customers.findOne({ _id: customerId });
  }

  /**
   * Mark customer as inactive
   * @param  {String} customerId
   * @return {Promise} Updated customer
   */
  static async markCustomerAsNotActive(customerId) {
    await Customers.update(
      { _id: customerId },
      {
        $set: {
          'messengerData.isActive': false,
          'messengerData.lastSeenAt': new Date(),
        },
      },
    );

    return Customers.findOne({ _id: customerId });
  }

  /*
   * Update messenger session data
   * @param {String} customer id
   * @return {Promise} updated customer
   */
  static async updateMessengerSession({ _id, url }) {
    const now = new Date();
    const customer = await Customers.findOne({ _id });

    const query = {
      $set: {
        // update messengerData
        'messengerData.lastSeenAt': now,
        'messengerData.isActive': true,
      },
    };

    if (now - customer.messengerData.lastSeenAt > 6 * 1000) {
      // update session count
      query.$inc = { 'messengerData.sessionCount': 1 };

      // save access history by location.pathname
      const urlVisits = customer.urlVisits || {};
      urlVisits[url] = (urlVisits[url] || 0) + 1;

      query.urlVisits = urlVisits;
    }

    // update
    await Customers.findByIdAndUpdate(_id, query);

    // updated customer
    return Customers.findOne({ _id });
  }

  /*
   * Update customer's location info
   */
  static async updateLocation(_id, browserInfo) {
    await Customers.findByIdAndUpdate(
      { _id },
      {
        $set: { location: browserInfo },
      },
    );

    return Customers.findOne({ _id });
  }

  /*
   * Add companyId to companyIds list
   * @param {String} _id customer id
   * @param {String} companyId
   * @return {Promise}
   */
  static async addCompany(_id, companyId) {
    await Customers.findByIdAndUpdate(_id, { $addToSet: { companyIds: companyId } });

    // updated customer
    return Customers.findOne({ _id });
  }

  /*
   * If customer is a visitor then we will contact with this customer using
   * this information later
   */
  static async saveVisitorContactInfo({ customerId, type, value }) {
    if (type === 'email') {
      await Customers.update({ _id: customerId }, { 'visitorContactInfo.email': value });
    }

    if (type === 'phone') {
      await Customers.update({ _id: customerId }, { 'visitorContactInfo.phone': value });
    }

    return Customers.findOne({ _id: customerId });
  }
}

CustomerSchema.loadClass(Customer);

const Customers = mongoose.model('customers', CustomerSchema);

export default Customers;
