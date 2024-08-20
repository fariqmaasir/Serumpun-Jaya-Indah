//-------------------------LIBRARY-------------------------
const express = require("express");
const bodyParser = require("body-parser");
const client = require("./connection/node.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { database, user } = require("pg/lib/defaults.js");
const app = express();
const cors = require("cors");
const SibApiV3Sdk = require("sib-api-v3-sdk");
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const multer = require("multer");
const { DATE } = require("sequelize");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "./img/");
  },
  filename(req, file, cb) {
    const uniqueName = Date.now();
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });
//-------------------------LIBRARY-------------------------

//-------------------------CONNECTION-------------------------
client.connect((err) => {
  if (err) {
    console.log(err.message);
  } else {
    console.log("Connected");
  }
});
//-------------------------CONNECTION-------------------------
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey =
  "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";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

//-------------------------ROUTING-------------------------
//--post--
app.post("/register", upload.single("user_image"), register);
app.post("/login", login);
app.post("/loginAdmin", loginAdmin);
app.post("/loginWithEmail", loginWithEmail);
app.post("/loginWithWhatsapp", loginWithWhatsapp);
app.post("/verificationOtp", validate, verificationOtp);
app.post("/forgetPassword", forgetPassword);
app.post("/resetPassword", validate, resetPassword);
app.post("/addCart", validate, addCart);
//--get--
app.get("/getInfo", validate, getUser);
app.get("/profile", profile);
app.get("/getCart", validate, getCart);
app.get("/getProduct", validate, getProduct);
//-------------------------ROUTING-------------------------

//-------------------------ROUTING CHECK-------------------------
app.get("/", (req, res) => {
  res.send("Hello World!");
});
//-------------------------ROUTING CHECK-------------------------

//-------------------------ROUTING CHECK-------------------------

const JWT_SECRET = "2d6i0l1la";

//-------------------------ROUTING CHECK-------------------------

//-------------------------MIDDLEWARE-------------------------
function validate(req, res, next) {
  const token = req.headers.token;
  const responObj = {
    success: true,
    data: [],
    message: "validate success",
  };

  try {
    const decode = jwt.verify(token, JWT_SECRET);

    req.user = decode;
    next();
  } catch (error) {
    responObj.success = false;
    responObj.message = error.message;

    res.status(401).json(responObj);
  }
}
//-------------------------MIDDLEWARE-------------------------

//-------------------------FUNCTION-------------------------

async function register(req, res) {
  try {
    const { user_name, user_email, user_password } = req.body;

    const user_image = req.file.filename;

    //hash
    const salt = 10;
    const hashedPassword = await bcrypt.hash(user_password, salt);
    //hash

    await client.query(
      `insert into users (user_name, user_email, user_password, user_image, user_role) values('${user_name}','${user_email}','${hashedPassword}','${user_image}' , 'users')`
    );

    console.log(success);
    res.json({ success: "register_berhasil" });
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
}

async function getUser(req, res) {
  try {
    await res.json({
      message: "SELAMAT DATANG DI INFO, TUAN",
      data: req.user,
      success: true,
    });
  } catch (error) {
    res.json(error);
  }
}

async function profile(req, res) {
  await client.query(
    `SELECT (user_email, user_name, user_image) FROM users WHERE user_id = '${user_id}'`
  );
}

async function editImageProfile(req, res) {
  await client.query();
}

async function login(req, res) {
  try {
    //get data from frontend
    const { user_email, user_password } = req.body;
    //get data from database
    const checkAcc = await client.query(
      `SELECT * FROM users WHERE user_email = '${user_email}'`
    );
    console.log(checkAcc.rows);
    const dataAcc = checkAcc.rows[0];
    const isValid = await bcrypt.compareSync(
      user_password,
      dataAcc.user_password
    );
    if (!isValid) {
      throw new Error("password anda salah");
    }

    if (isValid) {
      const payload = {
        user_id: dataAcc.user_id,
        user_name: dataAcc.user_name,
        user_email: dataAcc.user_email,
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
      // console.log(token)
      res.json({ jwt: token });
    }
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
}
async function loginAdmin(req, res) {
  try {
    const { user_email, user_password } = req.body;
    const checkAcc = await client.query(
      `SELECT * FROM users WHERE user_email = '${user_email}'`
    );
    // console.log(checkAcc.rows)
    const dataAcc = checkAcc.rows[0];
    // console.log(dataAcc)
    if (dataAcc.user_role != "admin") {
      throw new Error("anda bukan admin :p");
    }
    const isValid = await bcrypt.compareSync(
      user_password,
      dataAcc.user_password
    );
    if (isValid) {
      const payload = {
        user_id: dataAcc.user_id,
        user_name: dataAcc.user_name,
        user_email: dataAcc.user_email,
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
      // console.log(token)
      res.json({ jwt: token });
    }
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
}

async function sendEmail() {
  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("API called successfully. Returned data: " + data);
    res.json({ success: "email berhasil" });
  } catch (error) {
    console.error(error);
  }
}

async function loginWithEmail(req, res) {
  try {
    const { user_email } = req.body;
    //mencari apakah email ada di database
    const checkEmail = await client.query(
      `SELECT * FROM users WHERE user_email = '${user_email}'`
    );

    //-------------DATA USER-------------
    const email =
      checkEmail.rows.length > 0 ? checkEmail.rows[0].user_email : null;
    const name =
      checkEmail.rows.length > 0 ? checkEmail.rows[0].user_name : null;
    const otp = checkEmail.rows.length > 0 ? checkEmail.rows[0].user_otp : null;
    //-------------DATA USER-------------

    if (!email) {
      throw new Error("email tidak ada");
    }

    // cek apakah otp sudah ada
    if (otp) {
      throw new Error("otp sudah dikirimkan");
    }

    const expiredAt = Date.now() + 1000 * 60 * 20;
    const randomNumber = Math.floor(Math.random() * 900000) + 100000;

    // 1. simpan ke db

    await client.query(
      `update users set user_otp = '${randomNumber}', user_otp_expired_at = '${expiredAt}' where user_email = '${email}'`
    );

    // 2. kirim ke email user ( otp nya )

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    // const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
    const sender = {
      email: "killmepls30@gmail.com",
      name: "Serumpun Jaya Indah",
    };
    const receiver = [
      {
        email: email,
      },
    ];
    const sendSmtpEmail = {
      sender,
      to: receiver,
      subject: "Request Login With Otp",
      textContent: "Login With Otp",
      htmlContent: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html dir="ltr" lang="en">
      
        <head>
          <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
        </head>
      
        <body style="background-color:#ffffff;font-family:HelveticaNeue,Helvetica,Arial,sans-serif">
          <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:360px;background-color:#ffffff;border:1px solid #eee;border-radius:5px;box-shadow:0 5px 10px rgba(20,50,70,.2);margin-top:20px;margin:0 auto;padding:68px 0 130px">
            <tbody>
              <tr style="width:100%">
                <td><img alt="Plaid" height="88" src="https://react-email-demo-jsqyb0z9w-resend.vercel.app/static/plaid-logo.png" style="display:block;outline:none;border:none;text-decoration:none;margin:0 auto" width="212" />
                  <p style="font-size:11px;line-height:16px;margin:16px 8px 8px 8px;color:#0a85ea;font-weight:700;font-family:HelveticaNeue,Helvetica,Arial,sans-serif;height:16px;letter-spacing:0;text-transform:uppercase;text-align:center">Login With Otp</p>
                  <h1 style="color:#000;display:inline-block;font-family:HelveticaNeue-Medium,Helvetica,Arial,sans-serif;font-size:20px;font-weight:500;line-height:24px;margin-bottom:0;margin-top:0;text-align:center">Enter the following code to login.</h1>
                  <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="background:rgba(0,0,0,.05);border-radius:4px;margin:16px auto 14px;vertical-align:middle;width:280px">
                    <tbody>
                      <tr>
                        <td>
                          <p style="font-size:32px;line-height:40px;margin:0 auto;color:#000;display:inline-block;font-family:HelveticaNeue-Bold;font-weight:700;letter-spacing:6px;padding-bottom:8px;padding-top:8px;width:100%;text-align:center">'${otp}'</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p style="font-size:15px;line-height:23px;margin:0;color:#444;font-family:HelveticaNeue,Helvetica,Arial,sans-serif;letter-spacing:0;padding:0 40px;text-align:center">Not expecting this email?</p>
                  <p style="font-size:15px;line-height:23px;margin:0;color:#444;font-family:HelveticaNeue,Helvetica,Arial,sans-serif;letter-spacing:0;padding:0 40px;text-align:center">Contact<!-- --> <a href="mailto:killmepls30@gmail.com" style="color:#444;text-decoration:underline" target="_blank">killmepls30@gmail.com</a> <!-- -->if you did not request this code.</p>
                </td>
              </tr>
            </tbody>
          </table>
          <p style="font-size:12px;line-height:23px;margin:0;color:#000;font-weight:800;letter-spacing:0;margin-top:20px;font-family:HelveticaNeue,Helvetica,Arial,sans-serif;text-align:center;text-transform:uppercase">Securely powered by Plaid.</p>
        </body>
      
      </html>
      `,
    };

    sendEmail(sendSmtpEmail);

    return res.json({ success: true }).status(200);
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
}

async function loginWithWhatsapp(req, res) {}

// async function verificationOtp(req, res) {
//   try {
//     const { user_otp , user_id} = req.body
//     console.log(req.body)
//     const user = req.user
//     // console.log(user)
//     const checkOtp = await client.query(
//       `SELECT * FROM users WHERE user_id = '${user_id}' `
//     )
//     console.log(checkOtp.rows[0].user_otp)
//     if (user_otp == checkOtp.rows[0].user_otp) {
//       const payload = {
//         user_id: checkOtp.rows[0].user_id,
//         user_name: checkOtp.rows[0].user_name,
//         user_email: checkOtp.rows[0].user_email,
//       };
//       const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
//       console.log('ini adalah token' + token)
//       return res.json({ success: true }).status(200);
//     }
//   } catch (error) {
//     console.log(error)
//     return res.json({ success: false, message: error.message });
//   }
// }

// code mamad
async function verificationOtp(req, res) {
  try {
    const userId = req.user && req.user.user_id ? req.user.user_id : null;
    const userOtp = req.body && req.body.user_otp ? req.body.user_otp : null;

    if (!userId || !userOtp) {
      throw new Error("otp code required!");
    }

    const rawQuery = `SELECT *
    FROM public.users
    WHERE user_id = ${userId}
      AND user_otp = ${userOtp}
      AND user_otp_expired_at >= ${Date.now()}
      LIMIT 1
      `;

    const [user] = (await client.query(rawQuery)).rows;

    if (!user) {
      throw new Error("invalid otp!");
    }

    const token = jwt.sign(payload, secret, { expiresIn: "2h" });

    return res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
}

async function forgetPassword(req, res) {
  try {
    const { user_email } = req.body;
    const checkEmail = await client.query(
      `SELECT * FROM users WHERE user_email = '${user_email}'`
    );
    //cek apakah ada email yang sesuai
    if (checkEmail.rows.length == 0) {
      console.log("salah");
      //kasih response
      res.json({ response: "email tidak terdaftar" });
    }
    // console.log(checkEmail.rows[0].user_name)
    //-------------DATA USER-------------
    const id = checkEmail.rows[0].user_id;
    const name = checkEmail.rows[0].user_name;
    const email = checkEmail.rows[0].user_email;
    const password = checkEmail.rows[0].user_password;
    //-------------DATA USER-------------

    const secret = JWT_SECRET + password;
    const payload = {
      user_id: id,
      user_email: email,
    };
    const token = jwt.sign(payload, secret, { expiresIn: "2h" });
    const link = `http://localhost:5500/resetPassword.html/${token}`;
    // console.log(link)

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    // const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
    const sender = {
      email: "killmepls30@gmail.com",
      name: "serumpun jaya indah",
    };
    const receiver = [
      {
        email: req.body.user_email,
      },
    ];
    const sendSmtpEmail = {
      sender,
      to: receiver,
      subject: "request to change password",
      textContent: "change password",
      htmlContent: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html dir="ltr" lang="en">

      <head>
        <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
      </head>
      <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Dropbox reset your password<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
      </div>

      <body style="background-color:#f6f9fc;padding:10px 0">
        <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:37.5em;background-color:#ffffff;border:1px solid #f0f0f0;padding:45px">
          <tbody>
            <tr style="width:100%">
              <td><img alt="Dropbox" height="33" src="https://react-email-demo-jsqyb0z9w-resend.vercel.app/static/dropbox-logo.png" style="display:block;outline:none;border:none;text-decoration:none" width="40" />
                <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                  <tbody>
                    <tr>
                      <td>
                        <p style="font-size:16px;line-height:26px;margin:16px 0;font-family:&#x27;Open Sans&#x27;, &#x27;HelveticaNeue-Light&#x27;, &#x27;Helvetica Neue Light&#x27;, &#x27;Helvetica Neue&#x27;, Helvetica, Arial, &#x27;Lucida Grande&#x27;, sans-serif;font-weight:300;color:#404040">Hi <!-- -->'${name}'<!-- --></p>
                        <p style="font-size:16px;line-height:26px;margin:16px 0;font-family:&#x27;Open Sans&#x27;, &#x27;HelveticaNeue-Light&#x27;, &#x27;Helvetica Neue Light&#x27;, &#x27;Helvetica Neue&#x27;, Helvetica, Arial, &#x27;Lucida Grande&#x27;, sans-serif;font-weight:300;color:#404040">Someone recently requested a password change for your Dropbox account. If this was you, you can set a new password here:</p><a href="'${link}'" style="background-color:#007ee6;border-radius:4px;color:#fff;font-family:&#x27;Open Sans&#x27;, &#x27;Helvetica Neue&#x27;, Arial;font-size:15px;text-decoration:none;text-align:center;display:inline-block;width:210px;padding:14px 7px 14px 7px;line-height:100%;max-width:100%" target="_blank"><span><!--[if mso]><i style="letter-spacing: 7px;mso-font-width:-100%;mso-text-raise:21" hidden>&nbsp;</i><![endif]--></span><span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:10.5px">Reset password</span><span><!--[if mso]><i style="letter-spacing: 7px;mso-font-width:-100%" hidden>&nbsp;</i><![endif]--></span></a>
                        <p style="font-size:16px;line-height:26px;margin:16px 0;font-family:&#x27;Open Sans&#x27;, &#x27;HelveticaNeue-Light&#x27;, &#x27;Helvetica Neue Light&#x27;, &#x27;Helvetica Neue&#x27;, Helvetica, Arial, &#x27;Lucida Grande&#x27;, sans-serif;font-weight:300;color:#404040">If you don&#x27;t want to change your password or didn&#x27;t request this, just ignore and delete this message.</p>
                        <p style="font-size:16px;line-height:26px;margin:16px 0;font-family:&#x27;Open Sans&#x27;, &#x27;HelveticaNeue-Light&#x27;, &#x27;Helvetica Neue Light&#x27;, &#x27;Helvetica Neue&#x27;, Helvetica, Arial, &#x27;Lucida Grande&#x27;, sans-serif;font-weight:300;color:#404040">To keep your account secure, please don&#x27;t forward this email to anyone. See our Help Center for<!-- --> <a href="" style="color:#067df7;text-decoration:underline" target="_blank">more security tips.</a></p>
                        <p style="font-size:16px;line-height:26px;margin:16px 0;font-family:&#x27;Open Sans&#x27;, &#x27;HelveticaNeue-Light&#x27;, &#x27;Helvetica Neue Light&#x27;, &#x27;Helvetica Neue&#x27;, Helvetica, Arial, &#x27;Lucida Grande&#x27;, sans-serif;font-weight:300;color:#404040">Happy Dropboxing!</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>

    </html>
      `,
    };
    async function sendEmail() {
      try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("API called successfully. Returned data: " + data);
        res.json({ success: "email berhasil" });
      } catch (error) {
        console.error(error);
      }
    }
    sendEmail();
  } catch (error) {
    console.log(error.message);
    return res.send(error);
  }
}

async function resetPassword(req, res) {
  try {
    const user = req.user;
    console.log(user.user_id);
    const { password } = req.body;

    //hash
    const salt = 10;
    const hashedPassword = await bcrypt.hash(password, salt);
    //hash

    console.log(hashedPassword);

    const changePassword = await client.query(
      `UPDATE users
       SET user_password = '${hashedPassword}"
       WHERE user_id = '${user.user_id}'`
    );
  } catch (error) {
    console.log(error);
  }
}

async function getProduct(req, res) {
  // const { product_id } = req.params;
  try {
    const dataProduct = await client.query(`select * from products`);
    res.json({
      product_data: dataProduct.rows,
      user_data_id: req.user.user_id,
    });
  } catch (error) {
    res.json(error);
  }
}

async function addCart(req, res) {
  console.log("addCart is runing .... ");
  try {
    const { product_id } = req.body;

    const query = `insert into carts (product_id,user_id) values(${product_id} ,${req.user.user_id})`;
    console.log("addCart >>>> proses query : " + query);
    await client.query(query);
    res.json("data success");
  } catch (error) {
    console.log("[ERR] >>>>> " + error.message);
    res.json(error);
  }
}

async function getCart(req, res) {
  try {
    const user = req.user;

    const { user_id } = user;
    const dataProduct = await client.query(
      `SELECT * FROM carts
      left join products ON products.product_id = carts.product_id
      where user_id = ${user_id}`
    );
    console.log(dataProduct.rows);
    res.json({ data: dataProduct.rows });
  } catch (error) {
    console.log(error);
    res.json(error);
  }
}
//-------------------------FUNCTION-------------------------

//-------------------------PORT-------------------------
const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
//-------------------------PORT-------------------------
