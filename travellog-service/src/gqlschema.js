import { gql } from "apollo-server";

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    reviews: [Review!]!
  }

  type Place {
    id: ID!
    name: String!
    location: String!
    imageUrl: String
    reviews: [Review!]!
    avgRating: Float
  }

  type Review {
    id: ID!
    rating: Int!
    comment: String
    user: User!
    place: Place!
  }

  type Query {
    users: [User!]!
    places: [Place!]!
    reviews: [Review!]!
    place(id: ID!): Place
    user(id: ID!): User
  }

  type Mutation {
    addUser(name: String!, email: String!, password: String!): User!
    addPlace(name: String!, location: String!, imageUrl: String): Place!
    addReview(userId: ID!, placeId: ID!, rating: Int!, comment: String): Review!
  }
`;
