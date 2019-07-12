# @phnq/api

[![CircleCI](https://circleci.com/gh/pgostovic/api.svg?style=svg)](https://circleci.com/gh/pgostovic/api)

[![npm version](https://badge.fury.io/js/%40phnq%2Fapi.svg)](https://badge.fury.io/js/%40phnq%2Fapi)

Receives "request" messages from WebSocket clients and publishes them to pub/sub.
Receives "response" messages from Services via pub/sub subscription, and sends them to WebSocket clients.

## Message Flow

When the API service starts up, it assigns itself a unique key -- possibly a UUID. This key will be
used by other services to route response messages back to this server instance so they can be sent
back to the relevant client.

Incoming messages from WebSocket connections are published to pub/sub after some extra data is added.
The service instance unique key is added to the message so the destination service can send a response
back to the same WebSocket connection. For example, suppose the following message is received from a WebSocket:

```json
{
  "id": 5,
  "type": "auth.createSession",
  "data": {
    "email": "user@domain.com",
    "password": "mypassword"
  }
}
```

The API service instance unique key (i.e. `22369A7C-ED41-4AB3-803F-C4F714141EF5`) is appended to the message
as the `_source` attribute.

```json
{
  "id": 5,
  "type": "auth.createSession",
  "data": {
    "email": "user@domain.com",
    "password": "mypassword"
  },
  "_source": "22369A7C-ED41-4AB3-803F-C4F714141EF5"
}
```

### Kafka specifics

The incoming message type is parsed as `TOPIC.SERVICE_TYPE`. Accordingly, the above message type will be
parsed as TOPIC=auth, SERVICE_TYPE=createSession. In this case the message will be published to the
`auth` topic. Subscribers to the `auth` topic will be able to handle a `createSession` message.

On start-up, the API service instance will subscribe to the `service-response` topic. This generic topic subscription
means that this API service instance will receive all responses, but will ignore responses that are not
intended for this instance. The alternative would be to subscribe to a topic that includes the unique key.
