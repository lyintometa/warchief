import DataAccess from './dataAccess.js';
import PlayerEntity from './entities/PlayerEntity.js';

const prefix = 'player-data'

export default class PlayerAccess {
    #dataAccess
    #data

    init = async guild => {
        this.#dataAccess = new DataAccess(prefix)
        this.#data = await this.#dataAccess.read(guild)
    }

    getPlayerData = () => this.#data

    createOrUpdate = async (user, playerClass, playerSpec) => {
        if (!this.#data[user.id]) this.#data[user.id] = new PlayerEntity(user)
        this.#data[user.id].class = playerClass.id
        this.#data[user.id].specialization = playerSpec.id
        await this.#dataAccess.write(this.#data)
    }

    delete = async user => {
        delete this.#data[user.id]
        await this.#dataAccess.write(this.#data)
    }
}