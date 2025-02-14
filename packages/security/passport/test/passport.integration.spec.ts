import {PlatformTest} from "@tsed/common";
import {PlatformExpress} from "@tsed/platform-express";
import {PlatformTestUtils} from "@tsed/platform-test-utils";
import SuperTest from "supertest";
import {rootDir, Server} from "./app/Server";

const utils = PlatformTestUtils.create({
  rootDir,
  platform: PlatformExpress,
  server: Server
});

describe("Passport", () => {
  let request: SuperTest.SuperTest<SuperTest.Test>;

  beforeEach(utils.bootstrap({}));
  beforeEach(() => {
    request = SuperTest(PlatformTest.callback());
  });

  afterEach(() => PlatformTest.reset());

  it("should log the user", async () => {
    const response = await request.post("/auth/login").send({
      email: "admin@tsed.io",
      password: "admin@tsed.io"
    }).expect(200);

    expect(response.body.email).toBe("admin@tsed.io");
  });

  it("should throw bad request", async () => {
    const response = await request.post("/auth/login").send({}).expect(400);

    expect(response.body).toEqual({
      "name": "AuthenticationError",
      "message": "Bad Request",
      "status": 400,
      "errors": []
    });
  });
});