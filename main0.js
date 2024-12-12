import redisClient from './utils/redis';

redisClient.client.on('ready', async () => {
    console.log(redisClient.isAlive()); // Should now return true
    console.log(await redisClient.get('myKey')); // Initially null
    await redisClient.set('myKey', 12, 5); // Set key with expiration
    console.log(await redisClient.get('myKey')); // 12

    setTimeout(async () => {
        console.log(await redisClient.get('myKey')); // null after 10 seconds
    }, 1000 * 10);
});

