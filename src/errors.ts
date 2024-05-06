export class UserError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UserError";
	}
}

export class ApplicationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ApplicationError";
	}
}
