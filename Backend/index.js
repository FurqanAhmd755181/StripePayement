import cors from "cors";
import express from "express";
import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";

const stripe = new Stripe("sk_test_51QFz4kRucE7EoiJydCEEnEdAA30FXJmEJxQbrNQKvBqH6XZQJA2lF8JgztifBf6G7bQ9MoPGDR7bjmi7aSttMIRv00cpTg7mpU");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/payment", async (req, res) => {
  const { product, token } = req.body;

  console.log("Product:", product);
  console.log("Price:", product.price);

  const idempotencyKey = uuidv4();

  try {
    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id,
    });

    // Create a charge
    const charge = await stripe.charges.create(
      {
        amount: product.price * 100, // Stripe uses cents
        currency: "usd",
        customer: customer.id,
        receipt_email: token.email,
        description: `Purchase of ${product.name}`,
        shipping: {
          name: token.card.name,
          address: {
            country: token.card.address_country,
          },
        },
      },
      { idempotencyKey } 
    );

    res.status(200).json(charge);
    console.log(res.status);
  } catch (error) {
    console.error("Error creating charge:", error);
    res.status(500).json({ error: "Payment failed" });
  }
});

// Listen
app.listen(8282, () => console.log("I'm listening on port 8282"));
