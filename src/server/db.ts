import * as Nedb from "nedb-promises"
import { config } from "../config"

class Db {
  public queries: Nedb
  public renderInstances: Nedb
  public obsSources: Nedb
  public obsScenes: Nedb

  constructor() {
    this.queries = Nedb.create({
      autoload: true,
      filename: `${__dirname}/../../datastore/db/${config.db}/queries.nedb`
    })
    this.renderInstances = Nedb.create({
      autoload: true,
      filename: `${__dirname}/../../datastore/db/${config.db}/renderInstances.nedb`
    })
    this.obsSources = Nedb.create(process.env.NODE_ENV === "production" ? {} : {
      autoload: true,
      filename: `${__dirname}/../../datastore/db/${config.db}/obsSources.nedb`
    })
    this.obsScenes = Nedb.create(process.env.NODE_ENV === "production" ? {} : {
      autoload: true,
      filename: `${__dirname}/../../datastore/db/${config.db}/obsScenes.nedb`
    })
    this.queries.persistence.setAutocompactionInterval(20000)
    this.renderInstances.persistence.setAutocompactionInterval(20000)
    this.obsSources.persistence.setAutocompactionInterval(20000)
    this.obsScenes.persistence.setAutocompactionInterval(20000)
  }
}

export default new Db()
