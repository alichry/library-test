export class ClientError extends Error {
    constructor(message: string) {
        super(message);
  
        Object.setPrototypeOf(this, ClientError.prototype);
        this.name = this.constructor.name;
    }
}

export class EntityNotFoundError extends ClientError {
    constructor(message: string) {
        super(message);
  
        Object.setPrototypeOf(this, EntityNotFoundError.prototype);
        this.name = this.constructor.name;
    }
}

export class CheckOutError extends ClientError {
    constructor(message: string) {
        super(message);
  
        Object.setPrototypeOf(this, CheckOutError.prototype);
        this.name = this.constructor.name;
    }
}

export class ReturnError extends ClientError {
    constructor(message: string) {
        super(message);
  
        Object.setPrototypeOf(this, ReturnError.prototype);
        this.name = this.constructor.name;
    }
}
