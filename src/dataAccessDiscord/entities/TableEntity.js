export default class TableEntity{
    channel
    message

    constructor(channel, message){
        this.channel = channel.id
        this.message = message.id
    }
}