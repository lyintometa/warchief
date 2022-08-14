import PlayerAccess from './playerAccess.js';
import SettingsAccess from './settingsAccess.js';

class DataAccessService{
    playerAccesses = {}
    settingsAccesses = {}

    init = async client => {
        const initPromises = []
        client.guilds.cache.forEach(guild => this.initGuild(guild));
        await Promise.all(initPromises)
    }

    initGuild = async guild => {
        //console.log(guild)
        const playerAccess = new PlayerAccess()
        await playerAccess.init(guild)
        this.playerAccesses[guild.id] = playerAccess

        const settingsAccess = new SettingsAccess()
        await settingsAccess.init(guild, playerAccess.getPlayerData())
        this.settingsAccesses[guild.id] = settingsAccess
    }

    getDataAccessPlayer = guildId => {
        var dataAccess = this.playerAccesses[guildId]
        if (!dataAccess) throw new Error("Tried to get a PlayerAccess that does not exist.")
        return dataAccess
    }

    getDataAccessSettings = guildId => {
        var dataAccess = this.settingsAccesses[guildId]
        if (!dataAccess) throw new Error("Tried to get a SettingsAccess that does not exist.")
        return dataAccess
    }

    guildCreate = async guild => {
        const playerAccess = new PlayerAccess()
        await playerAccess.init(guild)
        this.playerAccesses[guild.id] = playerAccess
    }

    guildDelete = guild => {
        delete this.playerAccesses[guild.id]
    }
}

export default new DataAccessService()