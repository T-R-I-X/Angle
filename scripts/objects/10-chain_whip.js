const Random    = require('../../src/random').Random;
const Broadcast = require('../../src/broadcast').Broadcast;
const ItemUtil  = require('../../src/item_util').ItemUtil;
const Effects   = require('../../src/effects').Effects;

const util = require('util');

exports.listeners = {

  wield: function (l10n) {
    return function (location, room, player, players) {
      const toRoom = Broadcast.toRoom(room, player, null, players);

      const firstPartyMessage = '<blue>You grip the chain tight in your hand, slinging it over your shoulder.</blue>';
      const thirdPartyMessage = '<blue>' + player.getShortDesc('en') + ' grips a long heavy chain, and slings it over their shoulder.</blue>'
      toRoom({ firstPartyMessage, thirdPartyMessage });

      const missedPrerequisites = this.checkPrerequisites(player);

      missedPrerequisites.forEach(prereq => {
        switch (prereq) {
          case 'stamina':
            return ItemUtil.penalize(player, item, 'stamina', factor => {
              const name = ItemUtil.getPenaltyDesc(item, location, 'encumbered');
              player.warn('You can barely hold the chain, much less swing it properly...');

              player.addEffect(name , Effects.encumbered({ player, factor }));
              player.combat.addSpeedMod({ name, effect: speed => speed / factor });
              player.combat.addToHitMod({ name, effect: toHit => toHit * factor });
              player.combat.addDodgeMod({ name, effect: dodge => dodge * factor });
            });
        }
      });

      if (!missedPrerequisites.length) {
        player.warn('You could sow destruction with this.')
        const bonus = Math.round(player.getAttribute('stamina') / 2);
        player.combat.addDamageMod({
          name: 'chain_whip' + this.getUuid(),
          effect: damage => damage + bonus
        });
      }

    }
  },

  remove: function (l10n) {
    return function (location, room, player, players) {
      const toRoom = Broadcast.toRoom(room, player, null, players);
      const firstPartyMessage = [
        '<yellow>You stop wielding the giant chain.</yellow>'
      ];
      const thirdPartyMessage = [
        player.getShortDesc('en') + ' stops brandishing the giant chain.'
      ];
      Broadcast.consistentMessage(toRoom, { firstPartyMessage, thirdPartyMessage });

      ItemUtil.removeDefaultPenaltes(player, this, location);
      player.combat.deleteAllMods('chain_whip' + this.getUuid());
    }
  },

  hit: function (l10n) {
		return function (room, attacker, defender, players, hitLocation, damage) {
      const toRoom = Broadcast.toRoom(room, attacker, null, players);

      let firstPartyMessage, thirdPartyMessage;
      if (hitLocation === 'head') {
        firstPartyMessage = [
          "You wallop " + defender.getShortDesc() + ' in the side of the head.'
        ];
        thirdPartyMessage = [
          attacker.getName() + " wallops " + defender.getShortDesc() + ' in the side of the head.'
        ];
        player.warn(defender.getShortDesc() + ' is dazed!');
        defender.addEffect('concussed', Effects.slow({
          target: defender,
          magnitude: .66,
          duration: 15000,
          deactivate: () => player.warn(defender.getShortDesc() + ' regains their focus.');
        }));
      } else if (hitLocation.includes('leg')) {
        firstPartyMessage = [
          ""
        ];
        thirdPartyMessage = [
          ""
        ];

      } else {
        firstPartyMessage = [
          ""
        ];
        thirdPartyMessage = [
          ""
        ];

      }


      Broadcast.consistentMessage(toRoom, { firstPartyMessage, thirdPartyMessage });

      attacker.combat.addDamageMod({
        name: 'cleaver' + this.getUuid(),
        effect: damage => damage + .5
      });
		}
	},

};
