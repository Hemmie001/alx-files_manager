import dbClient from './utils/db';

const waitConnection = () => {
    return new Promise((resolve, reject) => {
        let i = 0;
        const repeatFct = async () => {
            await new Promise(r => setTimeout(r, 1000)); // Properly await a promise
            i += 1;
            if (i >= 10) {
                reject(new Error("Failed to connect to DB after 10 attempts")); // Provide a rejection reason
            } else if (!dbClient.isAlive()) {
                console.log(`Attempt ${i}: Database not alive, retrying...`);
                repeatFct();
            } else {
                resolve();
            }
        };
        repeatFct();
    });
};

(async () => {
    console.log("Initial DB alive status:", dbClient.isAlive());
    try {
        await waitConnection();
        console.log("Final DB alive status:", dbClient.isAlive());
        console.log("Number of users:", await dbClient.nbUsers());
        console.log("Number of files:", await dbClient.nbFiles());
    } catch (error) {
        console.error("Error:", error.message); // Handle connection error
    }
})();
