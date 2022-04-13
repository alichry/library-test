import { App,
    Stack,
    StackProps,
    Table,
    Api
} from "@serverless-stack/resources";

export default class LibraryStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        const table = new Table(this, 'dynamodb', {
            primaryIndex: {
                partitionKey: "pk",
                sortKey: "sk"
            },
            globalIndexes: {
                checkedOutBooks: {
                    partitionKey: "pk",
                    sortKey: "bookCheckOutDate"
                }
            },
            fields: {
                // SST is in beta (TableFieldType is not exported)
                pk: "string",
                sk: "string",
                bookCheckOutDate: "string"
            }
        });

        this.setDefaultFunctionProps({
            environment: {
                tableName: table.tableName,
                checkedOutBooksIndex: 'checkedOutBooks',
                bookCheckoutLimit: process.env.bookCheckoutLimit || '',
                checkOutDuration: process.env.checkOutDuration || '',
            },
            permissions: [table]
        });
        
        const librarianApi = new Api(this, "lib-api", {
            routes: {
                "POST /book/{isbn}": "src/librarian-api/addbook.handler",
                "GET /book/overdue": "src/librarian-api/listoverduebooks.handler",
                "DELETE /book/{bookId}": "src/librarian-api/deletebook.handler",
                "POST /user": "src/librarian-api/adduser.handler"
            },
        });

        const userApi = new Api(this, "user-api", {
            routes: {
                "GET /book": "src/user-api/listbooks.handler",
                "POST /checkout": "src/user-api/checkoutbook.handler",
                "POST /return": "src/user-api/returnbook.handler"
            }
        });

        this.addOutputs({
            "librarianApiEndpoint": librarianApi.url,
            "userApiEndpoint": userApi.url,
        });
    }
}
