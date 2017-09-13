export const types = `
  scalar Date
  scalar JSON

  type EngageData {
    messageId: String
    brandId: String
    content: String
    fromUserId: String
    fromUser: User
    kind: String
    sentAs: String
  }


  type UserDetails {
    avatar: String
    fullName: String
  }

  type User {
    _id: String!
    details: UserDetails
  }

  type Attachment {
    url: String
    name: String
    type: String
    size: Int
  }

  input AttachmentInput {
    url: String
    name: String
    type: String
    size: Int
  }

  input FieldValueInput {
    _id: String!
    type: String
    validation: String
    text: String
    value: String
  }

  type Integration {
    _id: String!
    uiOptions: JSON
    messengerData: JSON
  }

  type Conversation {
    _id: String!
    customerId: String!
    integrationId: String!
    status: String!
    content: String
    createdAt: Date
    participatedUsers: [User]
    readUserIds: [String]
  }

  type Message {
    _id: String!
    conversationId: String!
    customerId: String
    user: User
    content: String
    createdAt: Date
    attachments: [Attachment]
    internal: Boolean
    engageData: EngageData
  }

  type Field {
    _id: String
    formId: String
    type: String
    check: String
    text: String
    description: String
    options: [String]
    isRequired: Boolean
    name: String
    validation: String
    order: Int
  }

  type Form {
    title: String
    fields: [Field]
  }

  type MessengerConnectResponse {
    integrationId: String!
    uiOptions: JSON
    messengerData: JSON
    customerId: String!
  }

  type EndConversationResponse {
    customerId: String!
  }

  type FormConnectResponse {
    integrationId: String!
    integrationName: String!
    formId: String!
    formData: JSON!
  }

  type Error {
    fieldId: String
    code: String
    text: String
  }

  type LiveRoomIntegration {
    status: String
    participantOne: String
    participantTwo: String
  }
`;

export const queries = `
  type Query {
    conversations(integrationId: String!, customerId: String!): [Conversation]
    getMessengerIntegration(brandCode: String!): Integration
    getLiveRoom(brandCode: String!): LiveRoomIntegration
    lastUnreadMessage(integrationId: String!, customerId: String!): Message
    totalUnreadCount(integrationId: String!, customerId: String!): Int
    messages(conversationId: String): [Message]
    unreadCount(conversationId: String): Int
    conversationLastStaff(_id: String): User
    isMessengerOnline(integrationId: String!): Boolean
    form(formId: String): Form
  }
`;

export const mutations = `
  type Mutation {
    endConversation(brandCode: String!, data: JSON): EndConversationResponse

    messengerConnect(
      brandCode: String!,
      email: String,
      phone: String,
      name: String,
      isUser: Boolean,
      data: JSON,
      browserInfo: JSON,
      cachedCustomerId: String
    ): MessengerConnectResponse

    insertMessage(
      integrationId: String!,
      customerId: String!,
      conversationId: String!,
      message: String,
      attachments: [AttachmentInput]
    ): Message

    simulateInsertMessage(messageId: String): Message
    notify: String
    readConversationMessages(conversationId: String): String
    readEngageMessage(messageId: String!, customerId: String!): String
    saveCustomerGetNotified(customerId: String!, type: String!, value: String!): String
    formConnect(brandCode: String!, formCode: String!): FormConnectResponse
    saveForm(integrationId: String!, formId: String!, submissions: [FieldValueInput]): [Error]
    sendEmail(toEmails: [String], fromEmail: String, title: String, content: String): String
  }
`;

export const subscriptions = `
  type Subscription {
    messageInserted(conversationId: String!): Message
    notification: String
  }
`;
