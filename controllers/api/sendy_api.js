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

var http = require('http');
var https = require('https');
var buffer = require('buffer');
var querystring = require('querystring');

module.exports = function SendyApiControllerModule(pb) {

  //PB dependencies
  var util           = pb.util;

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

      self.pluginService  = new pb.PluginService();

      /**
       *
       * @property service
       * @type {ArticleServiceV2}
       */
      self.articleService = new pb.ArticleServiceV2(self.getServiceContext());

      //create the loader context
      var ctx     = self.getServiceContext();
      ctx.service = self.articleService;
      self.contentViewLoader = new pb.ContentViewLoader(ctx);

      cb(err, true);
    };
    SendyApiController.super_.prototype.init.apply(this, [context, init]);
  };

  SendyApiController.prototype.createCampaign = function(cb) {
    var self = this;

    var id = this.pathVars.id;

    self.pluginService.getSettingsKV('sendy-pencilblue', function(err, settings) {
      if (util.isError(err)) {
        pb.log.error(err);
        var content = pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, err.message);
        cb({content: content, code: 500});
        return;
      }
      else if (!settings || !settings.sendy_server_url || settings.sendy_server_url.length === 0
          || !settings.api_key || settings.api_key.length === 0) {
        pb.log.warn('Sendy: Settings have not been initialized!');
        var content = pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'Sendy: Settings have not been initialized!', err);
        cb({content: content, code: 500});
        return;
      }


      self.articleService.get(id, {render: true, readMore: settings.read_more}, function(err, article) {
        if (!util.isObject(article)) {
          pb.log.error("Article not found [" + id + "]");
          var content = pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'Article not found', err);
          cb({content: content, code: 500});
          return;
        }

        pb.log.info("Creating Email Campaign for [" + article.headline + "]");

        var useHttps = settings.use_https;

        var data = querystring.stringify({
          api_key: settings.api_key,
          from_name: settings.from_name,
          from_email: settings.from_email,
          reply_to: settings.reply_to,
          list_ids: settings.list_ids,
          brand_id: settings.brand_id,
          query_string: settings.query_string,
          send_campaign: 0,
          subject: pb.config.siteName + " - " + article.headline,
          //plain_text: "",
          html_text: article.layout
        });

        // Call Sendy API
        var options = {
          host: settings.sendy_server_url,
          port: useHttps ? 443 : 80,
          path: '/api/campaigns/create.php',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data)
          }
        };

        var protocol = useHttps ? https : http;
        var req = protocol.request(options, function(res) {
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            pb.log.silly("body: " + chunk);

            // TODO: Handle response
            //var content = pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'success', "Success");
            //cb({content: content, code: 200})

          });
        });

        req.write(data);
        req.end();
      });
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