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

  // ──────────────────────────────────────────────────────────────────────────
  // PROJECTS: cho phép chạy từng nhóm test riêng biệt
  //   npm test inventory  →  chỉ chạy src/__tests__/inventory/
  //   npm test checkout   →  chỉ chạy src/__tests__/order/
  // ──────────────────────────────────────────────────────────────────────────
  projects: [
    {
      displayName: "inventory",
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["<rootDir>/src/__tests__/inventory"],
      testMatch: ["**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { tsconfig: "<rootDir>/tsconfig.test.json" },
        ],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
    },
    {
      displayName: "checkout",
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["<rootDir>/src/__tests__/order"],
      testMatch: ["**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { tsconfig: "<rootDir>/tsconfig.test.json" },
        ],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
    },
  ],
};
