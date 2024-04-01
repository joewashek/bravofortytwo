type logObject = {
  type:string,
  message: string
}

class ConsoleProxy{
  private _console: Console;
  private _consoleIsPresent: boolean;
  private _messageBuffer: logObject[] = [];

  constructor(console:Console){
    this._console = console;
    this._consoleIsPresent = (this._console !== null && this._console !== undefined);
  }

  logInfo(message:string,context:any = undefined) {
    const logObj = { type: "INFO", message: message};
    if (this._consoleIsPresent) { 
        this._console.log(logObj);
        return;
    }
    this._messageBuffer.push(logObj);
}

logWarning(message:string,context:any = undefined) {
    const logObj = { type: "WARN", message: message};
    if (this._consoleIsPresent) { 
        this._console.log(logObj);
        return;
    }
    this._messageBuffer.push(logObj);
}

logError(message:string,context:any = undefined) {
    const logObj = { type: "ERROR", message: message};
    if (this._consoleIsPresent) { 
        this._console.log(logObj);
        return;
    }
    this._messageBuffer.push(logObj);
}

logFatal(message:string,context:any = undefined) {
    const logObj = { type: "FATAL", message: message};
    if (this._consoleIsPresent) { 
        this._console.log(logObj);
        return;
    }
    this._messageBuffer.push(logObj);
}

flushBuffer() {
    this._messageBuffer.splice(0, this._messageBuffer.length);
}
}

const theProxy = new ConsoleProxy(console);
export default theProxy;  
