Submission Service API
=================


**Version:** 1.0.0

<br/><br/><br/>
# **EVENTS**<br/>

<br/>
### /events
---
## ***GET***
**Description:** Get events

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Success |
| 400 | InvalidError | [Error](#error) |
| 404 | NotFoundError | [Error](#error) |

**Response Example:** 

```
{
    "data": {
        "id": "73d259a8-c7b6-46c9-9cf9-9438ecd875e9",
        "code": 0,
        "content": "Event test submission",
        "description": "Catch all event",
        "election": "e1",
        "key": "DEFAULT_EVENT",
        "entity": "user",
        "domain": "voting"        "metadata": {
            "received_time": "2017-07-24T03:02:38.894Z"
        },
        "period": "p1",
        "severity": "info",
        "source": "election-service",
        "time": "2017-07-20T17:18:59.553Z",
        "voter": "v1"
    }
}
```
## ***POST***
**Description:** Create an event

**Parameters**

| Name | Located in | Required | Schema | Description |
| ---- | ---------- | -------- | ------ | ----------- |
| body | body | Yes | [event](#event) |  |

**Request Example:** 

```
{
        "content": "Voter logged in",
        "election": "e1",
        "key": "AUTHENTICATION_SUCCESS",
        "period": "p1",
        "severity": "info",
        "source": "vote-service",
        "entity": "user",
        "domain": "authentication"        "time": "2017-07-20T17:18:59.553Z",
        "voter": "v1"
}
```
**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 201 | Success |
| 400 | InvalidError | [Error](#error) |
| 404 | NotFoundError | [Error](#error) |

**Response Example:** 

```
{
    "data": {
        "id": "b492fedb-17eb-4e53-accd-4d1f27b8978e",
        "code": 1001,
        "content": "Voter logged in",
        "description": "",
        "election": "e1",
        "key": "AUTHENTICATION_SUCCESS",
        "entity": "user",
        "domain": "authentication"        "metadata": {
            "received_time": "2017-07-24T04:13:34.292Z"
        },
        "period": "p1",
        "severity": "info",
        "source": "vote-service",
        "time": "2017-07-20T17:18:59.553Z",
        "voter": "v1"
    }
}
```
<br/>
### /events/{id}
---
## ***GET***
**Description:** Returns the event with the provided ID

**Parameters**

| Name | Located in | Required | Schema | Description |
| ---- | ---------- | -------- | ------ | ----------- |
| id | path | Yes | string | ID of resource to fetch |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Success | [event](#event) |
| 404 | NotFoundError | [Error](#error) |

**Response Example:** 

```
{
   "data": [
      {
         "id": "a8aec33c-c604-4a90-a90f-c2a953561c13",
         "code": 0,
         "content": "Test",
         "description": "Catch all event",
         "election": "",
         "key": "DEFAULT_EVENT",
         "metadata": {
            "received_time": "2017-07-24T03:25:56.576Z"
         },
         "period": "",
         "severity": "info",
         "source": "election-service",
         "time": "2017-07-20T17:18:59.553Z",
         "voter": ""
      },
      {
         "id": "a0bcd117-798b-4915-a081-664ab3bff154",
         "code": 0,
         "content": "Test",
         "description": "Catch all event",
         "election": "e1",
         "key": "DEFAULT_EVENT",
         "metadata": {
            "received_time": "2017-07-24T03:25:56.620Z"
         },
         "period": "p1",
         "severity": "info",
         "source": "election-service",
         "time": "2017-07-20T17:18:59.553Z",
         "voter": "v1"
      },
      {
         "id": "24275bee-0699-4761-b727-6ad5820f5a68",
         "code": 1001,
         "content": "Event test submission",
         "description": "",
         "election": "",
         "key": "AUTHENTICATION_SUCCESS",
         "metadata": {
            "received_time": "2017-07-24T03:25:56.464Z"
         },
         "period": "",
         "severity": "info",
         "source": "election-service",
         "time": "2017-07-20T17:18:59.553Z",
         "voter": ""
      },
      {
         "id": "b492fedb-17eb-4e53-accd-4d1f27b8978e",
         "code": 1001,
         "content": "Voter logged in",
         "description": "",
         "election": "e1",
         "key": "AUTHENTICATION_SUCCESS",
         "metadata": {
            "received_time": "2017-07-24T04:13:34.292Z"
         },
         "period": "p1",
         "severity": "info",
         "source": "vote-service",
         "time": "2017-07-20T17:18:59.553Z",
         "voter": "v1"
      }
   ],
   "pages": {
      "index": 0,
      "total": 1,
      "items": 4
   }
}
```
<br/><br/>
# **MODELS**
---
## <a name="event"></a>**event**  
An event created by the Voting System.

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| id | string | No | The unique identifier for an event. |
| source | string | No | The creator of the event. |
| key | string | No | The unique string identifier for an event. |
| code | integer | No | The integer identifier for an event. |
| timestamp | dateTime | No | The time the event was created. |
| severity | string | No | The level of severity of an event (RFC5424 syslog levels). |
| entity | string | No | Subject of the event (i.e. user, voter, application, etc.) |
| domain | string | No | The general (or specific) domain of the event (i.e. voting, authorization, etc.) |
| election | string | No | A Reference to an election. |
| period | string | No | A Reference to a period. |
| voter | string | No | A Reference to a voter. |
| content |  | Yes | The message(s) associated with an event. |
| metadata | object,null | No | Arbitrary additional string data to include in event. |
## <a name="error"></a>**Error**  


| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| statusCode | integer | Yes | HTTP Error code |
| name | string | Yes | Name of the error |
| message | string | No | Basic error message |
| details | string | No | Additional error details |
| code | integer | No | Sub error code (for different errors that must share same HTTP code) |

# **ERRORS**


##### InvalidError


```

{
   "name": "InvalidError",
   "message": "Request was invalid.",
   "statusCode": 400,
   "code": 4000
}

```


##### UnavailableError


```

{
   "name": "UnavailableError",
   "message": "Voting window is closed.",
   "statusCode": 401,
   "code": 4010
}

```


##### UnauthorizedError


```

{
   "name": "UnauthorizedError",
   "message": "User not authorized.",
   "statusCode": 401,
   "code": 4011
}

```


##### ForbiddenError


```

{
   "name": "ForbiddenError",
   "message": "User not authorized.",
   "statusCode": 403,
   "code": 4030
}

```


##### NotFoundError


```

{
   "name": "NotFoundError",
   "message": "Resource in request not found.",
   "statusCode": 404,
   "code": 4040
}

```


##### SpecificResourceNotFoundError


```

{
   "name": "SpecificResourceNotFoundError",
   "message": "Specific Resource not found.",
   "statusCode": 404,
   "code": 4041
}

```


##### ReferenceNotFoundError


```

{
   "name": "ReferenceNotFoundError",
   "message": "Referenced object not found.",
   "statusCode": 404,
   "code": 4042
}

```


##### AlreadyExistsError


```

{
   "name": "AlreadyExistsError",
   "message": "Resource already exists",
   "statusCode": 409,
   "code": 4091
}

```


##### ExternalRequestError


```

{
   "name": "ExternalRequestError",
   "message": "There was an error conmmunicating with upstream service.",
   "statusCode": 502,
   "code": 5020
}

```


##### ServiceUnavailableError


```

{
   "name": "ServiceUnavailableError",
   "message": "The service is currently unavailable (may be overloaded or down for maintenance).",
   "statusCode": 503,
   "code": 5030
}

```


##### GatewayTimeoutError


```

{
   "name": "GatewayTimeoutError",
   "message": "Did not receive a timely response from the upstream server.",
   "statusCode": 504,
   "code": 5040
}

```

