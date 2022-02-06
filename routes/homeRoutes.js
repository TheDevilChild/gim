const express = require('express');
const router = express.Router();
const {renderGamesListPage, renderHome,renderFiveInARow , renderUserPage} = require('../controllers/homeController');


router.route('/')
    .get(renderHome);

router.route('/games/FiveInARow')
    .get(renderFiveInARow);
        
router.route('/games')
    .get(renderGamesListPage);

router.route('/users')
    .get(renderUserPage);



module.exports = router;
