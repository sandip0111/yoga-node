const subscribeModel = require("../models/subscribeModel");
const { createContent } = require("../helpers/nodemail");

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
            contentPath: "emailTemplate/subscriberEmail2.html",
            mailTo: sub.email,
            subject: "More Insights from Yoga Vidya School",
            replacements: {},
          });

          sub.emailStage = 3;
          sub.nextEmailDate = new Date(Date.now() + 72 * 60 * 60 * 1000);
          await sub.save();
        } else if (sub.emailStage === 3) {
          await createContent({
            contentPath: "emailTemplate/subscriberEmail3.html",
            mailTo: sub.email,
            subject: "Continuing Your Journey with Yoga Vidya School",
            replacements: {},
          });

          sub.emailStage = 4;
          sub.nextEmailDate = null;
          await sub.save();
        }
      } catch (innerError) {}
    }
  } catch (error) {}
};

module.exports = { startScheduler };
