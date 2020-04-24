module.exports = async client => {
    client.on('ready', () => {
        console.log('Ready!')
    })
}