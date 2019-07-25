import Datastore = require("nedb-promises")
import { config } from "../config"

class Db {
  public queries: Datastore
  public renderInstances: Datastore
  public obsSources: Datastore
  public obsScenes: Datastore

  constructor() {
    this.queries = Datastore.create({
      autoload: true,
      filename: `${__dirname}/../../datastore/db/${config.db}/queries.nedb`
    })
    this.renderInstances = Datastore.create({
      autoload: true,
      filename: `${__dirname}/../../datastore/db/${config.db}/renderInstances.nedb`
    })
    this.obsSources = Datastore.create(process.env.NODE_ENV === "production" ? {} : {
      autoload: true,
      filename: `${__dirname}/../../datastore/db/${config.db}/obsSources.nedb`
    })
    this.obsScenes = Datastore.create(process.env.NODE_ENV === "production" ? {} : {
      autoload: true,
      filename: `${__dirname}/../../datastore/db/${config.db}/obsScenes.nedb`
    });

    (this.queries as any).persistence.setAutocompactionInterval(20000);
    (this.renderInstances as any).persistence.setAutocompactionInterval(20000);
    (this.obsSources as any).persistence.setAutocompactionInterval(20000);
    (this.obsScenes as any).persistence.setAutocompactionInterval(20000);
  }
}

export default new Db()
