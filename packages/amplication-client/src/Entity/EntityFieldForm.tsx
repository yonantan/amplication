import React, { useMemo } from "react";
import { Formik, FormikErrors } from "formik";
import omit from "lodash.omit";
import { isEmpty } from "lodash";
import { getSchemaForDataType } from "@amplication/data";
import { ToggleField } from "@amplication/design-system";
import * as models from "../models";
import { DisplayNameField } from "../Components/DisplayNameField";
import { Form } from "../Components/Form";
import NameField from "../Components/NameField";
import OptionalDescriptionField from "../Components/OptionalDescriptionField";
import FormikAutoSave from "../util/formikAutoSave";
import { validate } from "../util/formikValidateJsonSchema";
import { SYSTEM_DATA_TYPES } from "./constants";
import DataTypeSelectField from "./DataTypeSelectField";
import { SchemaFields } from "./SchemaFields";

export type Values = {
  id: string; //the id field is required in the form context to be used in "DataTypeSelectField"
  name: string;
  displayName: string;
  dataType: models.EnumDataType;
  required: boolean;
  searchable: boolean;
  description: string | null;
  properties: Object;
};

type Props = {
  onSubmit: (values: Values) => void;
  isDisabled?: boolean;
  defaultValues?: Partial<models.EntityField>;
  applicationId: string;
  entityDisplayName: string;
  isSystemData?: boolean;
};

const FORM_SCHEMA = {
  required: ["name", "displayName"],
  properties: {
    displayName: {
      type: "string",
      minLength: 1,
    },
    name: {
      type: "string",
      minLength: 1,
    },
  },
};

const NON_INPUT_GRAPHQL_PROPERTIES = ["createdAt", "updatedAt", "__typename"];

export const INITIAL_VALUES: Values = {
  id: "",
  name: "",
  displayName: "",
  dataType: models.EnumDataType.SingleLineText,
  required: false,
  searchable: false,
  description: "",
  properties: {},
};

const EntityFieldForm = ({
  onSubmit,
  defaultValues = {},
  isDisabled,
  applicationId,
  entityDisplayName,
  isSystemData,
}: Props) => {
  const initialValues = useMemo(() => {
    const sanitizedDefaultValues = omit(
      defaultValues,
      NON_INPUT_GRAPHQL_PROPERTIES
    );
    return {
      ...INITIAL_VALUES,
      ...sanitizedDefaultValues,
    };
  }, [defaultValues]);
  console.log(initialValues);

  return (
    <Formik
      initialValues={initialValues}
      validate={(values: Values) => {
        const errors: FormikErrors<Values> = validate<Values>(
          values,
          FORM_SCHEMA
        );
        //validate the field dynamic properties
        const schema = getSchemaForDataType(values.dataType);
        const propertiesError = validate<Object>(values.properties, schema);

        // Ignore related field ID error
        if ("relatedFieldId" in propertiesError) {
          // @ts-ignore
          delete propertiesError.relatedFieldId;
        }

        if (!isEmpty(propertiesError)) {
          errors.properties = propertiesError;
        }

        return errors;
      }}
      enableReinitialize
      onSubmit={onSubmit}
    >
      {(formik) => {
        const schema = getSchemaForDataType(formik.values.dataType);

        return (
          <Form childrenAsBlocks>
            {!isDisabled && <FormikAutoSave debounceMS={1000} />}

            <DisplayNameField
              name="displayName"
              label="Display Name"
              disabled={isDisabled ? isDisabled : isSystemData}
              required
            />
            <NameField
              name="name"
              disabled={isDisabled ? isDisabled : isSystemData}
              required
            />
            <OptionalDescriptionField
              name="description"
              label="Description"
              disabled={isDisabled ? isDisabled : isSystemData}
            />
            <div>
              <ToggleField
                name="required"
                label="Required Field"
                disabled={isDisabled ? isDisabled : isSystemData}
              />
            </div>
            <div>
              <ToggleField
                name="searchable"
                label="Searchable"
                disabled={isDisabled ? isDisabled : isSystemData}
              />
            </div>
            {!SYSTEM_DATA_TYPES.has(formik.values.dataType) && (
              <DataTypeSelectField
                label="Data Type"
                disabled={isDisabled ? isDisabled : isSystemData}
              />
            )}
            <SchemaFields
              schema={schema}
              isSystemData={isSystemData}
              isDisabled={isDisabled}
              applicationId={applicationId}
              entityDisplayName={entityDisplayName}
            />
          </Form>
        );
      }}
    </Formik>
  );
};

export default EntityFieldForm;
