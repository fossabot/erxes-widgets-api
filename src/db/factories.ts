import * as Random from 'meteor-random';
import * as faker from 'faker';

import {
  Integrations,
  Brands,
  Forms,
  Fields,
  Customers,
  Conversations,
  Messages,
  Users,
  Companies,
} from './models';

interface IUserParams {
  fullName?: string,
}
export const userFactory = (params: IUserParams={}) => {
  const user = new Users({
    details: {
      fullName: params.fullName || faker.random.word(),
    },
  });

  return user.save();
};

interface IBrandParams {
  name?: string,
  code?: string,
}
export const brandFactory = (params: IBrandParams={}) => {
  const brand = new Brands({
    name: params.name || faker.random.word(),
    code: params.code || faker.random.word(),
    userId: Random.id(),
  });

  return brand.save();
};

interface IIntegrationParams {
  kind?: string,
  brandId?: string,
  formId?: string,
}
export const integrationFactory = (params: IIntegrationParams={}) => {
  const integration = new Integrations({
    name: faker.random.word(),
    kind: params.kind || 'messenger',
    brandId: params.brandId || Random.id(),
    formId: params.formId || Random.id(),
  });

  return integration.save();
};

interface IFormParams {
  title?: string,
  code?: string,
}
export const formFactory = (params: IFormParams={}) => {
  const form = new Forms({
    title: params.title || faker.random.word(),
    code: params.code || Random.id(),
  });

  return form.save();
};

interface IFormFieldParams {
  contentTypeId?: string,
  type?: string,
  validation?: string,
  isRequired?: boolean,
}
export const formFieldFactory = (params: IFormFieldParams={}) => {
  const field = new Fields({
    contentType: 'form',
    contentTypeId: params.contentTypeId || Random.id(),
    type: params.type || faker.random.word(),
    name: faker.random.word(),
    validation: params.validation || faker.random.word(),
    text: faker.random.word(),
    description: faker.random.word(),
    isRequired: params.isRequired || false,
    number: faker.random.word(),
  });

  return field.save();
};

interface ICustomerParams {
  integrationId?: string,
  isActive?: boolean,
  urlVisits?: object,
}
export function customerFactory(params: ICustomerParams = {}) {
  const createdAt = faker.date.past();
  const customer = new Customers({
    integrationId: params.integrationId || Random.id(),
    createdAt,
    email: faker.internet.email(),
    isUser: faker.random.boolean(),
    name: faker.name.findName(),
    messengerData: {
      lastSeenAt: faker.date.between(createdAt, new Date()),
      isActive: params.isActive || false,
      sessionCount: faker.random.number(),
    },
    urlVisits: params.urlVisits,
  });

  return customer.save();
}

export function conversationFactory() {
  const conversation = new Conversations({
    createdAt: faker.date.past(),
    content: faker.lorem.sentence,
    customerId: Random.id(),
    integrationId: Random.id(),
    number: 1,
    messageCount: 0,
    status: Conversations.getConversationStatuses().NEW,
  });

  return conversation.save();
}

interface IConversationMessageParams {
  customerId?: string,
  conversationId?: string,
  engageData?: object,
  isCustomerRead?: boolean,
}
export function messageFactory(params: IConversationMessageParams={}) {
  const message = new Messages({
    userId: Random.id(),
    conversationId: Random.id(),
    customerId: Random.id(),
    content: faker.lorem.sentence,
    createdAt: faker.date.past(),
    isCustomerRead: params.isCustomerRead,
    engageData: params.engageData,
    ...params,
  });

  return message.save();
}

export function companyFactory() {
  const company = new Companies({
    name: faker.lorem.sentence,
    lastSeenAt: faker.date.past(),
    sessionCount: faker.random.number(),
  });

  return company.save();
}
