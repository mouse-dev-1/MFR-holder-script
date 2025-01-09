const axios = require("axios");
const Promise = require("bluebird");
const fs = require("fs")
const path = require("path")

const getPage = async (page, currentResults = []) => {

    try{

       console.log(`Getting page ${page}`)
    const {data} = await axios.post(`https://api-v2.foundation.app/electric/v2/graphql`, {
        query:
          "\n    query ShopPage($tokenFilter: TokenInput!, $page: Int, $perPage: Limit) {\n  token(by: {token: $tokenFilter}, filters: {existenceStatus: ANY}) {\n    ...Token\n  }\n  tokenHolders(by: {token: $tokenFilter}, page: $page, perPage: $perPage) {\n    tokenHolderBalances {\n      items {\n        ...TokenHolder\n      }\n      page\n      totalItems\n      totalPages\n    }\n    firstMinter {\n      ...UserWallet\n    }\n  }\n  isFirstRodeo(token: $tokenFilter)\n}\n    \n    fragment Token on ERC1155Token {\n  chainId\n  contractAddress\n  name\n  description\n  mintedCount\n  uniqueMintersCount\n  commentCount\n  tokenId\n  moderationType\n  isModerated\n  isDeleted\n  isBoosted\n  isSensitive\n  updatedAt\n  likes {\n    ...TokenLikes\n  }\n  category {\n    ...Category\n  }\n  saleConfiguration {\n    ...SaleConfiguration\n  }\n  creator {\n    ...UserWallet\n  }\n  media {\n    ...Media\n  }\n  externalLink {\n    ...ExternalLink\n  }\n}\n    \n\n    fragment TokenLikes on TokenLikes {\n  count\n  isLikedByCurrentUser\n}\n    \n\n    fragment Category on PostCategory {\n  name\n  displayName\n  imageUrl\n  themeColor\n  postCount\n}\n    \n\n    fragment SaleConfiguration on TokenTimedSaleConfiguration {\n  ... on TokenTimedSaleConfiguration {\n    saleType\n    status\n    startTime\n    endTime\n    mintPrice\n    saleTermsId\n  }\n}\n    \n\n    fragment UserWallet on UserWallet {\n  user {\n    ...User\n  }\n  wallet {\n    address\n  }\n}\n    \n\n    fragment User on User {\n  id\n  displayName\n  username\n  imageUrl\n}\n    \n\n    fragment Media on Media {\n  __typename\n  ... on ImageMedia {\n    processingStatus\n    sourceUrl\n    url\n    width\n    height\n    blurHash\n    imageMimeType: mimeType\n  }\n  ... on VideoMedia {\n    previewUrl\n    processingStatus\n    sourceUrl\n    staticUrl\n    url\n    width\n    height\n    videoMimeType: mimeType\n  }\n}\n    \n\n    fragment ExternalLink on ExternalLink {\n  __typename\n  ... on HighlightExternalLink {\n    title\n    url\n  }\n  ... on FoundationExternalLink {\n    title\n    url\n  }\n  ... on FXHashExternalLink {\n    title\n    url\n  }\n  ... on ArtBlocksExternalLink {\n    title\n    url\n  }\n}\n    \n\n    fragment TokenHolder on TokenHolderBalance {\n  count: tokenCount\n  holder {\n    ...UserWallet\n  }\n}\n    ",
        variables: {
          tokenFilter: {
            chainId: 8453,
            contractAddress: "0xf802757b9A55783341bC5c6E8fB2257D1A413bbf",
            tokenId: 10,
          },
          perPage: 100,
          page: page,
        },
        operationName: "ShopPage",
      })


      console.log(`Got ${data.data.tokenHolders.tokenHolderBalances.items.length} results, ${currentResults.length} cumulative results`)

      if(data.data.tokenHolders.tokenHolderBalances.items.length == 0) return currentResults;

      await Promise.delay(1000);

      const newPage = page + 1;
      return getPage(newPage, [...currentResults, ...data.data.tokenHolders.tokenHolderBalances.items])
    } catch(error){
        console.log(error)
        await Promise.delay(100);
        return getPage(page, currentResults)
    }
}



(async () => {

    const holdersData = await getPage(0, []);
    console.log(holdersData)
    fs.writeFileSync(path.join(__dirname, "./data.json"), JSON.stringify(holdersData, undefined, 4));



})();