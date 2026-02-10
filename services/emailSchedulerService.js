const subscribeModel = require("../models/subscribeModel");
const { createContent } = require("../helpers/nodemail");
const constants = require("../helpers/constants.json");

const startScheduler = async () => {
  try {
    const now = new Date();

    const subscribers = await subscribeModel.find({
      nextEmailDate: { $lte: now },
      emailStage: { $in: [2, 3] },
    });

    for (const sub of subscribers) {
      try {
        if (sub.emailStage === 2) {
          await createContent({
            contentPath: constants.EMAIL_TEMPLATE.SUBSCRIBER_EMAIL_2,
            mailTo: sub.email,
            subject: "Meet Yoga Vidya & Prashant – A Path of Tradition and Transformation",
            replacements: {
              NAME: sub.name,
            },
          });

          sub.emailStage = 3;
          sub.nextEmailDate = new Date(Date.now() + 72 * 60 * 60 * 1000);
          await sub.save();
        } else if (sub.emailStage === 3) {
          await createContent({
            contentPath: constants.EMAIL_TEMPLATE.SUBSCRIBER_EMAIL_3,
            mailTo: sub.email,
            subject: "Free course: Breath Detox Yoga 🕉️- Your next step into this path",
            replacements: {
              NAME: sub.name,
            },
          });

          sub.emailStage = null;
          sub.nextEmailDate = null;
          await sub.save();
        }
      } catch (innerError) {}
    }
  } catch (error) {}
};

module.exports = { startScheduler };
