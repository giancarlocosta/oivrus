#!/usr/bin/env node
//
//
//
const fs = require('fs');
const Ajv = require('ajv');
const derefSync = require('json-schema-deref-sync');

// Whether or not to generate dereferenced JSON Schema objects.
const deRef = false;

// Validator options.
const ajvOptions = {allErrors: true, useDefaults: true};

const jsonSchemaDirname = 'json-schemas';
const jsonSchemaPath = `${__dirname}/${jsonSchemaDirname}`;
const matchSchema = new RegExp('\.json$');
const schemaFiles = fs.readdirSync(jsonSchemaPath).filter(function(filename) {
    return filename.match(matchSchema)
});

// Load a JSON Schema from the `json-schemas` dir
//   which *should* be in this in our CWD.
function loadSchema(schemaFilename, deref=true) {
  if (deref) {
    return derefSync((require(`${jsonSchemaPath}/${schemaFilename}`)), {
      baseFolder: `${jsonSchemaPath}`
    });
  } else {
    return require(`${jsonSchemaPath}/${schemaFilename}`);
  }
};

// Compile a JSON Schema individually.  This approach fails when using schemas
//  with relative `$ref` references.  You need to add each one with `addSchema`
//  and then compilation happens correctly the first time a schema is used to
//  validate an instance.
function compileSchema(schemaData) {
  var ajv = Ajv(ajvOptions);
  ajv.compile(schemaData);
  return ajv;
};

var schemas = {};
var validator = Ajv(ajvOptions);

for (const schemaFile of schemaFiles) {
  const name = schemaFile.replace('.json', '');
  schemas[name] = loadSchema(`${schemaFile}`, deRef);
  validator.addSchema(schemas[name], name);
};

module.exports = {
  validator: validator,
  validate: validator.validate
};
