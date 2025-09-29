const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Use environment variable for security
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

// Helper: Send reply to LINE
async function replyMessage(replyToken, messages) {
  await axios.post(
    "https://api.line.me/v2/bot/message/reply",
    { replyToken, messages },
    { headers: { "Content-Type": "application/json", Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` } }
  );
}

// Carousel data
const collections = {
  marvel: [
    {
      thumbnailImageUrl: "https://www.threezerohk.com/wp-content/uploads/2023/11/DLX_IRONMAN-MK6_00-scaled.webp",
      title: "Iron Man",
      text: "Iron Man MK6",
      actions: [{ type: "uri", label: "Buy Now", uri: "https://www.threezerohk.com/product/iron-man-mark-6-battle-damaged/" }]
    },
    {
      thumbnailImageUrl: "https://www.threezerohk.com/wp-content/uploads/2025/09/DLX_Spider_Man_Advanced_Suit_2_0_Peter_Parker_04-scaled.jpg",
      title: "Spider-Man",
      text: "S.H.Figuarts Spider-Man",
      actions: [{ type: "uri", label: "Buy Now", uri: "https://www.threezerohk.com/product/spiderman-advancedsuit2-0-peterparker/" }]
    }
  ],
  transformers: [
    {
      thumbnailImageUrl: "https://www.threezerohk.com/wp-content/uploads/2025/08/Transformers_DLX_Jazz_05-scaled.jpg",
      title: "Nemesis Prime",
      text: "DLX Jazz",
      actions: [{ type: "uri", label: "Buy Now", uri: "https://www.threezerohk.com/product/transformersdlx-jazz-deluxe-edition/" }]
    },
    {
      thumbnailImageUrl: "https://ae01.alicdn.com/kf/Se0c417596089457a8d609f8b187b4ff9X.jpg_640x640q90.jpg",
      title: "Optimus Prime",
      text: "DLX Nemesis Prime",
      actions: [{ type: "uri", label: "Buy Now", uri: "https://www.threezerohk.com/product/nemesis-prime/" }]
    }
  ],
  anime: [
    {
      thumbnailImageUrl: "https://images.bigbadtoystore.com/images/p/full/2021/12/009954b2-4988-4125-a964-fa0d9c3e9246.jpg",
      title: "Naruto",
      text: "Naruto Uzumaki Figure",
      actions: [{ type: "uri", label: "Buy Now", uri: "https://www.threezerohk.com/product/naruto-uzumaki/" }]
    },
    {
      thumbnailImageUrl: "https://www.hobbymodel.net/web/board/2025/uez1ifsk05uggakibimr119202510331393504.jpeg",
      title: " Nezuko Kamado",
      text: " Nezuko Kamado Figure",
      actions: [{ type: "uri", label: "Buy Now", uri: "https://www.threezerohk.com/product/nezuko-kamado/" }]
    }
  ]
};

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  const events = req.body.events || [];
  for (let event of events) {
    const userMessage = (event.message?.text || "").toLowerCase();

    if (/find figures/i.test(userMessage)) {
      const messages = [
        {
          type: "text",
          text: "Choose your favorite collection:",
          quickReply: {
            items: Object.keys(collections).map(key => ({
              type: "action",
              action: { type: "message", label: key.charAt(0).toUpperCase() + key.slice(1), text: key }
            }))
          }
        }
      ];
      await replyMessage(event.replyToken, messages);

    } else if (collections[userMessage]) {
      const messages = [
        {
          type: "template",
          altText: `${userMessage.charAt(0).toUpperCase() + userMessage.slice(1)} Figures`,
          template: { type: "carousel", columns: collections[userMessage] }
        }
      ];
      await replyMessage(event.replyToken, messages);
    }
  }
  res.sendStatus(200);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
