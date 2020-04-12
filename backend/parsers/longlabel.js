#!/usr/bin/env node
const _ = require('lodash');
const debug = require('debug')('parser:longlabel');
const moment = require('moment');

const uxlang = require('./uxlang');

function parser(l, maintitle, isLive) {
    // La Super Pattuglia -  HALLOWEEN Special - Car City 🚗 Cartone animato per i bambini di Tom il Carro Attrezzi a Car City 5 mesi fa 22 minuti 63.190 visualizzazioni
    // The Moons of Mars Explained -- Phobos & Deimos MM#… Nutshell 4 years ago 115 seconds 2,480,904 views
    // Formazione a distanza: soluzioni immediate e idee di attività by CampuStore 4 hours ago 731 views

    let first = _.reverse(l.split(' '));
    let viz = [];

    let second = _.reduce(first, function(memo, e) {
        if(typeof viz == 'string') {
            memo.push(e);
            return memo;
        }
        let test = _.parseInt(e.replace(/[.,]/, ''));
        if(!_.isNaN(test)) {
            viz.push(e);
            _.reverse(viz);
            viz = _.join(viz, ' ');
        }
        else {
            viz.push(e);
        }
        return memo; 
    }, []);

    let duration = [];
    let third = [];
    if(isLive) {
        duration = "live";
        third = second;
    } else {
        third = _.reduce(second, function(memo, e) {
            if(typeof duration == 'string') {
                memo.push(e);
                return memo;
            }
            let test = _.parseInt(e.replace(/[.,]/, ''));
            if(!_.isNaN(test)) {
                duration.push(e);
                _.reverse(duration);
                duration = _.join(duration, ' ');
            }
            else {
                duration.push(e);
            }
            return memo; 
        }, []);
    }

    let timeago = [];
    let fourth = _.reduce(third, function(memo, e) {
        if(typeof timeago == 'string') {
            memo.push(e);
            return memo;
        }
        let test = _.parseInt(e.replace(/[.,]/, ''));
        if(!_.isNaN(test)) {
            timeago.push(e);
            _.reverse(timeago);
            timeago = _.join(timeago, ' ');
        }
        else {
            timeago.push(e);
        }
        return memo; 
    }, []);

    let title = _.join(_.reverse(fourth), ' ');

    return {
        viz,
        duration,
        timeago,
        title
    };
}

function settle(mined, source, title, displayTime, expandedTime, isLive) {
    // settle wants to settle differencies we (might) got from parsing strings
    // settle it is a kind of double-check as part of the parsing chain

    return {
        recommendedLength: 0,
        recommendedLengthSe: 0,
        recommendedViews: 0,
        recommendedTitle: 0,
        recommendedPubTime: 0
    }
}

module.exports = {
    parser,
    settle,
};
