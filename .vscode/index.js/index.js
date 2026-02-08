const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Fake database
const users = [
  {
    id: 1,
    email: "test@gmail.com",
    password: bcrypt.hashSync("123456", 10)
  }
];

// LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // user tekshirish
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({ msg: "User topilmadi" });
  }

  // password tekshirish
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ msg: "Parol noto‘g‘ri" });
  }

  // token yaratish
  const token = jwt.sign(
    { id: user.id },
    "secret_key",
    { expiresIn: "1h" }
  );

  res.json({
    msg: "Login muvaffaqiyatli ✅",
    token
  });
});

app.listen(3000, () => {
  console.log("Server 3000-portda ishlayapti 🚀");
});
