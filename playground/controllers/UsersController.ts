import { JsonController, Get, Param, Body, Post } from "../../src";

@JsonController("users")
export class UsersController {
	@Get(":params*")
	public getAllUsers(@Param("params") param: string) {
		return ["user1", "user2", "user3", param];
	}

	@Post("user")
	public async testUser(@Body() body: any) {
		console.log("GOT BODY", body);
		return { body, ok: true, random: Math.random() };
	}
}
