/*
 Copyright (C) 2015  Mark Baird

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

module.exports = function SendyApiControllerModule(pb) {

  //PB dependencies
  var util           = pb.util;
  var PluginService  = pb.PluginService;
  var ArticleServiceV2 = pb.ArticleServiceV2;

  /**
   * SendyApiControllerModule
   */
  function SendyApiController(){}
  util.inherits(SendyApiController, pb.BaseApiController);

  /**
   * Initializes the controller
   * @method init
   * @param {Object} context
   * @param {Function} cb
   */
  SendyApiController.prototype.init = function(context, cb) {
    var self = this;
    var init = function(err) {

      /**
       *
       * @property service
       * @type {ArticleServiceV2}
       */
      self.articleService = new ArticleServiceV2(self.getServiceContext());

      cb(err, true);
    };
    SendyApiController.super_.prototype.init.apply(this, [context, init]);
  };

  SendyApiController.prototype.createCampaign = function(cb) {
    var self = this;
    var id = this.pathVars.id;
    self.articleService.get(id, function(err, article) {
      if (!util.isObject(article)) {
        var content = pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, '', err);
        cb({content: content, code: isError ? 500 : 400});
        return;
      }

      // TODO: Call Sendy API here

      var content = pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'success', "Success");
      cb({content: content, code: 200})
    });
  };

  SendyApiController.getRoutes = function(cb) {
    var routes = [
      {
        method: 'post',
        path: "/api/sendy/create/:id",
        content_type: 'application/json',
        handler: "createCampaign",
        auth_required: true,
        access_level: pb.SecurityService.ACCESS_EDITOR,
        request_body: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data']
      }
    ];
    cb(null, routes);
  };

  //exports
  return SendyApiController;
};