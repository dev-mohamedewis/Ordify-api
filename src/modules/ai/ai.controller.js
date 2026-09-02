const { apiResponse } = require('../../utils/apiResponse');
const { analyzeConversationForMerchant } = require('./ai.service');

async function analyzeConversationController(req, res, next) {
  try {
    const result = await analyzeConversationForMerchant({
      merchantId: req.merchant._id,
      conversationId: req.params.conversationId
    });

    res.status(200).json(apiResponse(true, 'Conversation analyzed successfully', result, 200));
  } catch (error) {
    next(error);
  }
}

module.exports = { analyzeConversationController };
