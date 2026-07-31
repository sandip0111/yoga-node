"use strict";
const paymentService = require("../services/paymentService");
async function getPaymentDetailsById(req, res) {
  try {
    let result = await paymentService.getPaymentDetailsById(req.body.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ msg: err });
  }
}
async function checkoutRazorpayRishikesh(req, res) {
  {
    try {
      const result = await paymentService.checkoutRazorpayRishikesh(req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json(err);
    }
  }
}
async function getRazorPaymentResultRishikesh(req, res) {
  {
    try {
      const result = await paymentService.getRazorPaymentResultRishikesh(
        req.body,
        req,
      );
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json(err);
    }
  }
}
async function checkoutStripeForRishikesh(req, res) {
  try {
    let result = await paymentService.checkoutStripeForRishikesh(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function getStripePaymentResultRishikesh(req, res) {
  try {
    let result = await paymentService.getStripePaymentResultRishikesh(
      req.body,
      req,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function updatePaymentId200ttc(req, res) {
  try {
    let result = await paymentService.updatePaymentId200ttc(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function checkoutStripeForBali(req, res) {
  try {
    let result = await paymentService.checkoutStripeForBali(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function getStripePaymentResultBali(req, res) {
  try {
    let result = await paymentService.getStripePaymentResultBali(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function checkoutRazorpayRetreat(req, res) {
  {
    try {
      const result = await paymentService.checkoutRazorpayRetreat(req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json(err);
    }
  }
}
async function getRazorPaymentResultRetreat(req, res) {
  {
    try {
      const result = await paymentService.getRazorPaymentResultRetreat(
        req.body,
        req,
      );
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json(err);
    }
  }
}
async function checkoutStripeForRetreat(req, res) {
  try {
    let result = await paymentService.checkoutStripeForRetreat(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function getStripePaymentResultRetreat(req, res) {
  try {
    let result = await paymentService.getStripePaymentResultRetreat(
      req.body,
      req,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function checkoutPaypalForRetreat(req, res) {
  try {
    let result = await paymentService.checkoutPaypalForRetreat(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function getPaypalPaymentResultRetreat(req, res) {
  try {
    let result = await paymentService.getPaypalPaymentResultRetreat(
      req.body,
      req,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function checkoutPaypalForRishikesh(req, res) {
  try {
    let result = await paymentService.checkoutPaypalForRishikesh(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function getPaypalPaymentResultRishikesh(req, res) {
  try {
    let result = await paymentService.getPaypalPaymentResultRishikesh(
      req.body,
      req,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function checkoutPaypalForBali(req, res) {
  try {
    let result = await paymentService.checkoutPaypalForBali(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function getPaypalPaymentResultBali(req, res) {
  try {
    let result = await paymentService.getPaypalPaymentResultBali(req.body, req);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function checkoutPaypalForLiveClasses(req, res) {
  try {
    let result = await paymentService.checkoutPaypalForLiveClasses(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function getPaypalPaymentResultLiveClasses(req, res) {
  try {
    let result = await paymentService.getPaypalPaymentResultLiveClasses(
      req.body,
      req,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function checkoutRazorpayPg(req, res) {
  {
    try {
      const result = await paymentService.checkoutRazorpayPg(req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json(err);
    }
  }
}
async function getRazorPaymentResultPg(req, res) {
  {
    try {
      const result = await paymentService.getRazorPaymentResultPg(
        req.body,
        req,
      );
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json(err);
    }
  }
}
async function checkoutStripeForPg(req, res) {
  try {
    let result = await paymentService.checkoutStripeForPg(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function getStripePaymentResultPg(req, res) {
  try {
    let result = await paymentService.getStripePaymentResultPg(req.body, req);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function checkoutPaypalForPg(req, res) {
  try {
    let result = await paymentService.checkoutPaypalForPg(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function getPaypalPaymentResultPg(req, res) {
  try {
    let result = await paymentService.getPaypalPaymentResultPg(
      req.body,
      req,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function checkoutPaypalForPranaArambha(req, res) {
  try {
    let result = await paymentService.checkoutPaypalForPranaArambha(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function getPaypalPaymentResultPranaArambha(req, res) {
  try {
    let result = await paymentService.getPaypalPaymentResultPranaArambha(
      req.body,
      req,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function checkoutPaypalForSwaraSadhana(req, res) {
  try {
    let result = await paymentService.checkoutPaypalForSwaraSadhana(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}
async function getPaypalPaymentResultSwaraSadhana(req, res) {
  try {
    let result = await paymentService.getPaypalPaymentResultSwaraSadhana(
      req.body,
      req,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
}

module.exports = {
  getPaymentDetailsById,
  checkoutStripeForRishikesh,
  getStripePaymentResultRishikesh,
  checkoutRazorpayRishikesh,
  getRazorPaymentResultRishikesh,
  updatePaymentId200ttc,
  checkoutStripeForBali,
  getStripePaymentResultBali,
  checkoutRazorpayRetreat,
  getRazorPaymentResultRetreat,
  checkoutStripeForRetreat,
  getStripePaymentResultRetreat,
  checkoutPaypalForRetreat,
  getPaypalPaymentResultRetreat,
  checkoutPaypalForRishikesh,
  getPaypalPaymentResultRishikesh,
  checkoutPaypalForBali,
  getPaypalPaymentResultBali,
  checkoutPaypalForLiveClasses,
  getPaypalPaymentResultLiveClasses,
  checkoutRazorpayPg,
  getRazorPaymentResultPg,
  checkoutStripeForPg,
  getStripePaymentResultPg,
  checkoutPaypalForPg,
  getPaypalPaymentResultPg,
  checkoutPaypalForPranaArambha,
  getPaypalPaymentResultPranaArambha,
  checkoutPaypalForSwaraSadhana,
  getPaypalPaymentResultSwaraSadhana,
};
