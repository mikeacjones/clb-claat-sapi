# Codelab Claat sAPI

This API handles building codeslabs, maintaining the google docs folders and s3 bucket.

As this is my first foray into building an API with node (really my first node project) I don't expect it to be pretty; feel free to contact me via Slack with suggestions!

For a complete spec, see Exchange.

## Implemented Endpoints

```raml
/health:
  description: An "are you alive?" endpoint
  get:
    responses:
      200:
        body:
          application/json:
            example:
              message: OK

/codelab:
  post:
    body:
      application/json:
        type: LabConfig
    responses:
      200:
        body:
          application/json:
            type: Codelab
      409:
        body:
          application/json:
            example:
              message: Lab with name "TEST" already exists (NOTE - Validation is done against slugified lab title)
      400:
        body:
          application/json:
            example:
              message: Field labTitle is required
  /import:
    post:
      body:
        application/json:
          type: ImportLab
      responses:
        200:
          body:
            application/json:
              type: Codelab
        404:
          body:
            application/json:
              example:
                message: Please validate that the bot has access to the specified google doc, and that the ID is accurate.
        400:
          body:
            application/json:
              example:
                message: Please validate that the specified google doc is a valid claat.
  /{id}:
    uriParameters:
      id:
        type: string
        description: Unique ID for codelab
        example: 6047b4d8f468a3c695cb07d0
    /unpublish:
      post:
        description: Unpublishes codelab from all environments
        body:
          application/json:
            type: CallbackConfig
        responses:
          202:
            body:
              application/json:
                type: JobStarted
          404:
            body:
              application/json:
                example:
                  message: The specified lab does not exist
      /{env}:
        uriParameters:
          env:
            enum:
              - dev
              - prod
            example: dev
        post:
          description: Unpublish codelab from specified environment.
          body:
            application/json:
              type: CallbackConfig
          responses:
            202:
              body:
                application/json:
                  type: JobStarted
    /build:
      post:
        body:
          application/json:
            type: BuildJob
        responses:
          202:
            body:
              application/json:
                type: JobStarted
          404:
            body:
              application/json:
                example:
                  message: The specified lab does not exist
/category:
  post:
    description: Create a new category
    body:
      multipart/form-data:
        type: NewCategory
    responses:
      201:
        body:
          application/json:
            type: ExistingCategory
      409:
        body:
          application/json:
            example:
              message: Category with name "Anypoint MQ" already exists
  /{id}:
    uriParameters:
      id:
        type: string
        description: Unique ID for codelab
        example: 604823530d5fab000323e786
    put:
      description: Update an existing category
      body:
        multipart/form-data:
          type: NewCategory
      responses:
        204:
        404:
          body:
            application/json:
              example:
                message: Category with ID "kjadlksfjklds" not found
    delete:
      description: Delete an existing category; purges the files from S3
      responses:
        204:
        404:
          body:
            application/json:
              example:
                message: Category with ID "djlkajflkas" not found
```

## Data Types:

labConfig:

```json
{
  "labConfig": {
    "labTitle": "My Test Lab",
    "labSummary": "This is my test lab where I will show you how I test things that I'm testing.",
    "labCategories": [
      "DevOps",
      "MuleSoft"
    ],
    "labTags": [
      "test",
      "mulesoft",
      "devops",
      "cicd"
    ],
    "labAuthors": "Michael Jones",
    "labAuthorsLDAP": "mjones1@mulesoft.com"
  },
  "createdBy": "mjones1@mulesoft.com"
}
```

importLab:

```json
{
  "docId": "",
  "importedBy": ""
}
```

callback:

```json
{
  "jobId": "aklsjdklfjaskl-asdfkjlasjfla-asdfkljslk",
  "status": "success"
}
```