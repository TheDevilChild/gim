const express = require('express');
const router = express.Router();
const {renderGamesListPage, renderHome,render5InARow} = require('../controllers/homeController');


router.route('/')
    .get(renderHome);

router.route('/games/5InARow')
    .get(render5InARow);
        
router.route('/games')
    .get(renderGamesListPage);



module.exports = router;
