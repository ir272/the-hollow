import * as THREE from 'three';
import { PLAYER, CATHEDRAL } from '../utils/constants.js';
import { distance2D } from '../utils/math.js';

export class LoreSystem {
  constructor(scene) {
    this.scene = scene;
    this.notes = [];
    this.readNotes = new Set();
    this.currentNote = null;

    this.onNoteRead = null;   // callback(noteData)
    this.onNoteClose = null;

    this.createNotes();
  }

  createNotes() {
    const noteData = [
      {
        title: 'Brother Aldric\'s Journal — Day 1',
        text: 'We sealed the doors at vespers. The Abbott says the darkness beyond the walls grows hungry. I hear it scratching at the stained glass when the candles gutter low. We are safe here, he promises. The rituals will hold.\n\nI want to believe him.',
        position: new THREE.Vector3(-3, 0.8, -8),
      },
      {
        title: 'Brother Aldric\'s Journal — Day 14',
        text: 'Brother Matthias vanished during matins. His cell was empty, the door bolted from inside. His rosary was found on the altar, the beads cracked as if crushed by an unseen hand.\n\nThe Abbott says we must pray harder.',
        position: new THREE.Vector3(10, 0.5, -20),
      },
      {
        title: 'The Abbott\'s Decree',
        text: 'LET IT BE KNOWN: The four sacred artifacts must never be united. Separately, they bind the Warden to the stone. Together, they loose its hunger upon the world.\n\nShould you find them — leave them. Should you take them — may God forgive you.',
        position: new THREE.Vector3(0, 1.3, -CATHEDRAL.NAVE_LENGTH - 2),
      },
      {
        title: 'Scratched into Stone',
        text: 'it watches from the dark\nit does not breathe\nit does not blink\nit only waits\n\ndo not look at it\ndo not look at it\nDO NOT LOOK AT IT',
        position: new THREE.Vector3(-8, 0.5, -35),
      },
      {
        title: 'Brother Aldric\'s Journal — Day 31',
        text: 'Only four of us remain. The Warden walks the nave at night — I have seen its shadow stretch across the floor like black water. It is tall. So impossibly tall.\n\nThe candles keep it at bay. When they burn low, it draws closer. I can hear it breathing, though it has no mouth.',
        position: new THREE.Vector3(6, 0.5, -42),
      },
      {
        title: 'Fragment of a Prayer',
        text: 'O Lord, deliver us from the hollow dark,\nfrom the watcher in the stone,\nfrom the one who walks without footfall,\nfrom the silence that hungers.\n\nDeliver us from the truth we buried beneath the altar.',
        position: new THREE.Vector3(-10, 0.5, -50),
      },
      {
        title: 'Warning — Do Not Descend',
        text: 'The crypt is sealed for reason. The bones down there are not sleeping — they are listening. Brother Cael went down with a torch and came back... changed.\n\nHe would not speak. He would only smile. That terrible, knowing smile.\n\nWe sealed the trapdoor the next morning. By evening, Cael was gone.',
        position: new THREE.Vector3(1, 0.3, -28),
      },
      {
        title: 'Brother Aldric\'s Journal — Final Entry',
        text: 'I am the last. The candles burn low and I cannot find more wax. The Warden stands at the end of the nave, perfectly still. It has been standing there for three days.\n\nI think it is waiting for the light to die.\n\nI think it has always been waiting.\n\nIf you are reading this, you are already inside the Hollow. I am sorry. There is no door that leads out — only deeper in.',
        position: new THREE.Vector3(0, 0.5, -55),
      },
      {
        title: 'Ossuary Inscription',
        text: 'HERE LIE THE FAITHFUL\nWHO GAVE THEIR BONES TO THE WALL\nAND THEIR SOULS TO THE WARDEN\n\nMay their sacrifice hold the door shut.\nMay the door never be opened.\nMay you never read these words.',
        position: new THREE.Vector3(0, -4.5, -30 - 32),
      },
      {
        title: 'The Architect\'s Note',
        text: 'The cathedral was not built to worship God. It was built to contain something older. The arches are not arches — they are ribs. The nave is not a nave — it is a throat.\n\nYou are standing inside something alive.\n\nIt has been swallowing the faithful for centuries.\n\nAnd it is still hungry.',
        position: new THREE.Vector3(-5, -4.5, -30 - 10),
      },
    ];

    noteData.forEach((data, index) => {
      // Note mesh - parchment rectangle
      const noteGeo = new THREE.PlaneGeometry(0.25, 0.35);
      const noteMat = new THREE.MeshStandardMaterial({
        color: 0xc4a870,
        roughness: 0.9,
        emissive: 0xc4a870,
        emissiveIntensity: 0.05,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(noteGeo, noteMat);
      mesh.position.copy(data.position);
      mesh.rotation.x = -Math.PI / 4;
      mesh.rotation.y = Math.random() * 0.3 - 0.15;
      mesh.userData = { type: 'note', index, interactable: true };
      mesh.castShadow = true;

      this.scene.add(mesh);

      this.notes.push({
        mesh,
        data,
        index,
        read: false,
      });
    });
  }

  tryRead(playerPosition) {
    for (const note of this.notes) {
      if (note.read) continue;

      const dist = distance2D(
        playerPosition.x, playerPosition.z,
        note.data.position.x, note.data.position.z
      );

      // Also check Y proximity for crypt notes
      const yDist = Math.abs(playerPosition.y - note.data.position.y);

      if (dist < PLAYER.INTERACT_DISTANCE && yDist < 3) {
        this.currentNote = note;
        note.read = true;
        this.readNotes.add(note.index);

        // Dim the note mesh
        note.mesh.material.emissiveIntensity = 0;
        note.mesh.material.opacity = 0.5;
        note.mesh.material.transparent = true;

        if (this.onNoteRead) {
          this.onNoteRead(note.data);
        }

        return note;
      }
    }
    return null;
  }

  closeNote() {
    this.currentNote = null;
    if (this.onNoteClose) {
      this.onNoteClose();
    }
  }

  getNearest(playerPosition) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const note of this.notes) {
      if (note.read) continue;

      const dist = distance2D(
        playerPosition.x, playerPosition.z,
        note.data.position.x, note.data.position.z
      );

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { note, distance: dist };
      }
    }

    return nearest;
  }
}
