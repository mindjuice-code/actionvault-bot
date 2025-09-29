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

// Helper: Broadcast message to all users
async function broadcastMessage(messages) {
  try {
    await axios.post(
      "https://api.line.me/v2/bot/message/broadcast",
      { messages },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`
        }
      }
    );
    console.log("✅ Broadcast sent successfully");
  } catch (err) {
    console.error("❌ Broadcast failed:", err.response?.data || err.message);
  }
}

// Collections with latest arrivals first
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
      title: "DLX Jazz",
      text: "DLX Jazz Figure",
      actions: [{ type: "uri", label: "Buy Now", uri: "https://www.threezerohk.com/product/transformersdlx-jazz-deluxe-edition/" }]
    },
    {
      thumbnailImageUrl: "https://ae01.alicdn.com/kf/Se0c417596089457a8d609f8b187b4ff9X.jpg_640x640q90.jpg",
      title: "Nemesis Prime",
      text: "DLX Nemesis Prime",
      actions: [{ type: "uri", label: "Buy Now", uri: "https://www.threezerohk.com/product/nemesis-prime/" }]
    }
  ],
  anime: [
    {
      thumbnailImageUrl: "https://images.bigbadtoystore.com/images/p/full/2021/12/e1c581e6-deff-420b-aecf-4e8880ecaa2d.jpg",
      title: "Naruto",
      text: "Naruto Uzumaki Figure",
      actions: [{ type: "uri", label: "Buy Now", uri: "https://www.threezerohk.com/product/naruto-uzumaki/" }]
    },
    {
      thumbnailImageUrl: "https://hobby-bee.com/cdn/shop/products/Naruto_Uzumaki_withlogo_06-1-768x1152_grande.jpg?v=1639974642",
      title: "Nezuko Kamado",
      text: "Nezuko Kamado Figure",
      actions: [{ type: "uri", label: "Buy Now", uri: "https://www.threezerohk.com/product/nezuko-kamado/" }]
    }
  ]
};

const halloweenMessage = [
  {
    type: "text",
    text: "🎃 Halloween Fun is Here! 👻
From 15–31 Oct 2025, ActionVault has awesome spooky deals on your favorite figures! 🕸️
✨ Don’t miss out—share with your friends and join the fun! 🦇",
    quickReply: {
      items: [
        { type: "action", action: { type: "message", label: "Marvel Deals", text: "marvel" } },
        { type: "action", action: { type: "message", label: "Transformers Deals", text: "transformers" } },
        { type: "action", action: { type: "message", label: "Anime Deals", text: "anime" } }
      ]
    }
  }
];

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  const events = req.body.events || [];
  
  for (let event of events) {
    const userMessage = (event.message?.text || "").toLowerCase();

    // Step 1: Show category quick reply
    if (/find figures/i.test(userMessage)) {
      const messages = [
        {
          type: "text",
          text: "Choose your favorite category:",
          quickReply: {
            items: [
              { type: "action", action: { type: "message", label: "Marvel", text: "marvel" } },
              { type: "action", action: { type: "message", label: "Transformers", text: "transformers" } },
              { type: "action", action: { type: "message", label: "Anime", text: "anime" } },
              { type: "action", action: { type: "message", label: "Daily Recommendation", text: "daily" } }
            ]
          }
        }
      ];
      await replyMessage(event.replyToken, messages);

    // Step 2: Show latest arrivals in selected category
    } else if (collections[userMessage]) {
      const messages = [
        {
          type: "template",
          altText: `${userMessage.charAt(0).toUpperCase() + userMessage.slice(1)} Latest Arrivals`,
          template: { type: "carousel", columns: collections[userMessage] }
        }
      ];
      await replyMessage(event.replyToken, messages);

    // Step 3: Daily Recommendation (random figure)
    } else if (userMessage === "daily") {
      const allFigures = [].concat(...Object.values(collections));
      const randomFigure = allFigures[Math.floor(Math.random() * allFigures.length)];
      const messages = [
        {
          type: "template",
          altText: "Daily Figure Recommendation",
          template: {
            type: "carousel",
            columns: [
              {
                thumbnailImageUrl: randomFigure.thumbnailImageUrl,
                title: randomFigure.title,
                text: randomFigure.text,
                actions: randomFigure.actions
              }
            ]
          }
        }
      ];
      await replyMessage(event.replyToken, messages);
    }
  }

  res.sendStatus(200);
});

// Optional: show status on root
app.get("/", (req, res) => {
  res.send("ActionVault Bot is running!");
});

// Start server
const PORT = process.env.PORT || 3000;
// Manual trigger for Halloween broadcast
app.get("/send-halloween", async (req, res) => {
  await broadcastMessage(halloweenMessage);
  res.send("🎃 Halloween promotion broadcast sent!");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
