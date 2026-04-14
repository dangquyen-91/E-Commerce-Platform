/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  moduleNameMapper: {
    // Giải quyết path alias @/* → src/*
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Hiện tên test rõ ràng hơn khi chạy
  verbose: true,
};
