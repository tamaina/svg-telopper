import * as Nedb from "nedb-promises"
import { config } from "../config"

class Db {
  public presets: Nedb
  public renderInstances: Nedb
  public obsSources: Nedb
  public obsScenes: Nedb

  constructor() {
    this.presets = new Nedb({
      autoload: true,
      filename: `${__dirname}/../../datastore/db/${config.db}/presets.nedb`
    })
    this.renderInstances = new Nedb({
      autoload: true,
      filename: `${__dirname}/../../datastore/db/${config.db}/renderInstances.nedb`
    })
    this.obsSources = new Nedb(process.env.NODE_ENV === "production" ? {} : {
      autoload: true,
      filename: `${__dirname}/../../datastore/db/${config.db}/obsSources.nedb`
    })
    this.obsScenes = new Nedb(process.env.NODE_ENV === "production" ? {} : {
      autoload: true,
      filename: `${__dirname}/../../datastore/db/${config.db}/obsScenes.nedb`
    })
  }

  public async renewObs() {
    await this.obsSources.remove({}, { multi: true })
    await this.obsScenes.remove({}, { multi: true })
  }
}

export default new Db()
