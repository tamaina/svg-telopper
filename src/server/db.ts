import * as Nedb from "nedb"
import { config } from "../config"

interface IDb {
  presets: Nedb
  renderInstances: Nedb
}

export const db = {
  presets: new Nedb({
    autoload: true,
    filename: `${__dirname}/../../datastore/db/${config.db}/presets.db`
  }),
  renderInstances: new Nedb({
    autoload: true,
    filename: `${__dirname}/../../datastore/${config.db}/renderInstances.db`
  })
}
