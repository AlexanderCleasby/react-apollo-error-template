/*** SCHEMA ***/
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLFloat,
  GraphQLInt,
  GraphQLEnumType,
} from "graphql";

const FieldKeyType = new GraphQLEnumType({
  name: "FieldKey",
  values: {
    name: { value: "name" },
    height: { value: "height" },
    weight: { value: "weight" },
    cats: { value: "cats" },
  },
});

const CatsType = new GraphQLObjectType({
  name: "Cat",
  fields: {
    name: { type: GraphQLString },
    lives: { type: GraphQLInt },
  },
});

const CatsInputType = new GraphQLInputObjectType({
  name: "CatInput",
  fields: {
    name: { type: GraphQLString },
    lives: { type: GraphQLInt },
  },
});

const PersonType = new GraphQLObjectType({
  name: "Person",
  fields: {
    id: { type: GraphQLID },
    name: {
      type: new GraphQLObjectType({
        name: "Name",
        fields: {
          fieldKey: { type: FieldKeyType },
          ownerId: { type: GraphQLID },
          value: { type: GraphQLString },
        },
      }),
    },
    weight: {
      type: new GraphQLObjectType({
        name: "Weight",
        fields: {
          fieldKey: { type: FieldKeyType },
          ownerId: { type: GraphQLID },
          value: { type: GraphQLFloat },
        },
      }),
    },
    height: {
      type: new GraphQLObjectType({
        name: "Height",
        fields: {
          fieldKey: { type: FieldKeyType },
          ownerId: { type: GraphQLID },
          value: { type: GraphQLFloat },
        },
      }),
    },
    cats: {
      type: new GraphQLObjectType({
        name: "PersonCats",
        fields: {
          fieldKey: { type: FieldKeyType },
          ownerId: { type: GraphQLID },
          value: {
            type: new GraphQLObjectType({
              name: "PersonCatsValue",
              fields: {
                cats: { type: new GraphQLList(CatsType) },
              },
            }),
          },
        },
      }),
    },
  },
});

const peopleData = [
  {
    id: 1,
    name: { fieldKey: "name", value: "John Smith", ownerId: 1 },
    weight: { fieldKey: "weight", value: 60, ownerId: 1 },
    height: { fieldKey: "height", value: 60, ownerId: 1 },
    cats: {
      fieldKey: "cats",
      value: { cats: [{ name: "charlie", live: 8 }] },
      ownerId: 1,
    },
  },
  {
    id: 2,
    name: { fieldKey: "name", value: "Sara Smith", ownerId: 2 },
    weight: { fieldKey: "weight", value: 50, ownerId: 2 },
    height: { fieldKey: "height", value: 10, ownerId: 2 },
    cats: {
      fieldKey: "cats",
      value: { cats: [{ name: "dave", live: 8 }] },
      ownerId: 2,
    },
  },
  {
    id: 3,
    name: "Budd Deey",
    name: { fieldKey: "name", value: "Budd Deey", ownerId: 3 },
    weight: { fieldKey: "weight", value: 40, ownerId: 3 },
    height: { fieldKey: "height", value: 70, ownerId: 3 },
    cats: {
      fieldKey: "cats",
      value: { cats: [{ name: "whiskers", live: 8 }] },
      ownerId: 2,
    },
  },
];

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    people: {
      type: new GraphQLList(PersonType),
      resolve: () => peopleData,
    },
  },
});

const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addPerson: {
      type: PersonType,
      args: {
        name: { type: GraphQLString },
      },
      resolve: function (_, { name }) {
        const id = peopleData[peopleData.length - 1].id + 1;
        const person = {
          id,
          name: { value: name, fieldKey: "name", ownerId: id },
        };

        peopleData.push(person);
        return person;
      },
    },
    updatePerson: {
      type: PersonType,
      args: {
        id: { type: GraphQLID },
        name: {
          type: new GraphQLInputObjectType({
            name: "NameInput",
            fields: {
              fieldKey: { type: FieldKeyType },
              ownerId: { type: GraphQLInt },
              value: { type: GraphQLString },
            },
          }),
        },
        cats: {
          type: new GraphQLInputObjectType({
            name: "CatsInput",
            fields: {
              fieldKey: { type: FieldKeyType },
              ownerId: { type: GraphQLInt },
              value: {
                type: new GraphQLInputObjectType({
                  name: "PersonCatsValueInput",
                  fields: {
                    cats: { type: new GraphQLList(CatsInputType) },
                  },
                }),
              },
            },
          }),
        },
      },
      resolve: function (_, { id, name, cats }) {
        debugger;
        if (name) {
          peopleData[Number(id) - 1].name = name;
        }
        if (cats) {
          peopleData[Number(id) - 1].cats = cats;
        }
        debugger;
        return peopleData[Number(id) - 1];
      },
    },
  },
});

const schema = new GraphQLSchema({ query: QueryType, mutation: MutationType });

/*** LINK ***/
import { graphql, print } from "graphql";
import { ApolloLink, Observable } from "@apollo/client";
function delay(wait) {
  return new Promise((resolve) => setTimeout(resolve, wait));
}

const link = new ApolloLink((operation) => {
  return new Observable(async (observer) => {
    const { query, operationName, variables } = operation;
    await delay(300);
    console.log({ query, operationName, variables });
    try {
      const result = await graphql(
        schema,
        print(query),
        null,
        null,
        variables,
        operationName
      );
      observer.next(result);
      observer.complete();
    } catch (err) {
      observer.error(err);
    }
  });
});

/*** APP ***/
import React, { useState, useCallback } from "react";
import { render } from "react-dom";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  gql,
  useQuery,
  useMutation,
  defaultDataIdFromObject,
  useApolloClient,
} from "@apollo/client";
import faker from "faker";
import { omit } from "lodash";
import "./index.css";

const ALL_PEOPLE = gql`
  query AllPeople {
    people {
      id
      name {
        value
        fieldKey
        ownerId
      }
      weight {
        value
        fieldKey
        ownerId
      }
      height {
        value
        fieldKey
        ownerId
      }
      cats {
        value {
          cats {
            name
            lives
          }
        }
        fieldKey
        ownerId
      }
    }
  }
`;

const ADD_PERSON = gql`
  mutation AddPerson($name: NameInput) {
    addPerson(name: $name) {
      name {
        value
        fieldKey
        ownerId
      }
    }
  }
`;

const UPDATE_CATS = gql`
  mutation UpdateCats($id: ID!, $cats: CatsInput) {
    updatePerson(id: $id, cats: $cats) {
      cats {
        value {
          cats {
            name
            lives
          }
        }
        fieldKey
        ownerId
      }
    }
  }
`;

const UPDATE_NAME = gql`
  mutation UpdateName($id: ID!, $name: NameInput) {
    updatePerson(id: $id, name: $name) {
      name {
        value
        fieldKey
        ownerId
      }
    }
  }
`;

function App() {
  const [name, setName] = useState("");
  const [editId, changeEditId] = useState(null);
  const [updateName, changeUpdateName] = useState(null);
  const { loading, data, error } = useQuery(ALL_PEOPLE);
  const client = useApolloClient();
  if (error) console.error(error);

  const [updatePersonName] = useMutation(UPDATE_NAME);
  const updateCatsCb = useCallback((variables)=>{
    client.mutate({mutation: UPDATE_CATS, variables})
  },[])
  return (
    <main>
      <h1>Apollo Client Issue Reproduction</h1>
      <p>
        This application can be used to demonstrate an error in Apollo Client.
      </p>
      <h2>Names</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {data?.people.map((person) => (
            <li key={person.id}>
              {person.name.value}
              {person.weight?.value}
              {person.cats &&
                person.cats.value.cats.map((cat, i) => (
                  <div key={i}>{cat.name}</div>
                ))}
              <button
                onClick={() => {
                  changeEditId(Number(person.id));
                  changeUpdateName(
                    data.people[Number(person.id) - 1].name.value
                  );
                }}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}
      {editId && (
        <div>
          <label>name</label>
          <input
            value={updateName}
            onChange={(e) => changeUpdateName(e.target.value)}
          />
          <button
            onClick={() => {
              updatePersonName({
                variables: {
                  id: editId,
                  name: {
                    value: updateName,
                    ownerId: editId,
                    fieldKey: "name",
                  },
                },
              });
              changeUpdateName("");
              changeEditId(null);
            }}
          >
            update person {data?.people[editId - 1].id}
          </button>
          <button
            onClick={() => {
              const prevCats = data?.people[editId - 1].cats
                ? data?.people[editId - 1].cats.value.cats.map((cat) =>
                    omit(cat, "__typename")
                  )
                : [];
              updateCatsCb({
                  id: editId,
                  cats: {
                    value: {
                      cats: [
                      ...prevCats,
                      { name: faker.name.firstName(), lives: 9 },
                    ]},
                    fieldKey: "cats",
                    ownerId: editId,
                  },
                },
              );
            }}
          >
            give cat
          </button>
        </div>
      )}
    </main>
  );
}

function dataIdForField({ ownerId, fieldKey }) {
  return `${ownerId}::${fieldKey}`;
}

const client = new ApolloClient({
  cache: new InMemoryCache({
    dataIdFromObject(responseObject) {
      if (Object.prototype.hasOwnProperty.call(responseObject, "fieldKey") && 
      Object.prototype.hasOwnProperty.call(responseObject, "ownerId")) {
        return dataIdForField(responseObject);
      }

      return defaultDataIdFromObject(responseObject);
    },
  }),
  link,
});

render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById("root")
);
