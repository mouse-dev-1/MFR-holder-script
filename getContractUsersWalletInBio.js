const axios = require("axios");
const Promise = require("bluebird");
const fs = require("fs")
const path = require("path")
const rawData = require("./rawData.json");
const tokenEmissions = require("./tokenEmissions.json");


const getUserBioData = async (userId) => {

    try{
        const query = {
            query:
            "\n    query UserProfileById($id: String!) {\n  userProfile(by: {id: $id}) {\n    ...UserProfile\n  }\n}\n    \n    fragment UserProfile on UserProfile {\n  id\n bio\n username\n}\n    ",
            variables: { id: userId },
            operationName: "UserProfileById",
        };

        const {data} = await axios.post(`https://api-v2.foundation.app/electric/v2/graphql`, query);

        return data;

    } catch(error){
        console.log(error)
        await Promise.delay(1000);
        return getUserBioData(userId)
    }
}


(async () => {

    const tokenEmissionsWithBio = await Promise.mapSeries(tokenEmissions, async wallet => {
        
        if(!wallet.isContract) return wallet;
        
        const userId = rawData.find(a => a.holder.wallet.address == wallet.wallet).holder.user.id;
        
        const bioData = await getUserBioData(userId);
        if(userId != bioData.data.userProfile.id) throw "Incorrect bio returned";

        wallet.bio = bioData.data.userProfile.bio;
        return wallet

    })

    // Write the combined data to tokenEmissions.json
    fs.writeFileSync(path.join(__dirname, "./tokenEmissionsWithBio.json"), JSON.stringify(tokenEmissionsWithBio, null, 4));

})();

