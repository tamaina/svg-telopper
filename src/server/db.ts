import * as Nedb from "nedb-promises"
import { config } from "../config"

export const db = {
  presets: new Nedb({
    autoload: true,
    filename: `${__dirname}/../../datastore/db/${config.db}/presets.nedb`
  }),
  renderInstances: new Nedb({
    autoload: true,
    filename: `${__dirname}/../../datastore/db/${config.db}/renderInstances.nedb`
  }),
  obsSources: new Nedb({
    autoload: true,
    filename: `${__dirname}/../../datastore/db/${config.db}/obsSources.nedb`
  }),
  obsScenes: new Nedb({
    autoload: true,
    filename: `${__dirname}/../../datastore/db/${config.db}/obsScenes.nedb`
  })
}

export default db
