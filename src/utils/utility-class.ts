// Define a class named ErrorHandler that extends the built-in Error class
class ErrorHandler extends Error {
  
    // Constructor that takes additina two parameters - message (string) and statusCode (number)
    constructor(public message: string, public statusCode: number) {
        // Call the constructor of the base Error class with the provided message
        super(message);
        
        // Assign the provided statusCode to the class property
        this.statusCode = statusCode;
    }
}

// Export the ErrorHandler class as the default export for this module
export default ErrorHandler;


// In object-oriented programming, super is a keyword that refers to the parent class or superclass. 

// super calling the Error class with a message and that message is passed to errorHandler