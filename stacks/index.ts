import LibraryStack from "./LibraryStack";
import * as sst from "@serverless-stack/resources";

export default function main(app: sst.App): void {
    // Set default runtime for all functions
    app.setDefaultFunctionProps({
        runtime: "nodejs14.x"
    });
    if (app.stage === "dev") {
        app.setDefaultRemovalPolicy("destroy");
    }

    new LibraryStack(app, "library-stack");
}
