import goldTreeImg from '@/assets/tree/gold_tree.png'
import magicTreeImg from '@/assets/tree/magic_tree.png'
import normalTreeImg from '@/assets/tree/normal_tree.png'
import poplarTreeImg from '@/assets/tree/poplar_tree.png'
import willowTreeImg from '@/assets/tree/willow_tree.png'

export const TREE_TYPES = [
  {
    id: 't1',
    name: '橡树',
    time: 25 * 60,
    xp: 100,
    price: 0,
    levelReq: 1,
    icon: normalTreeImg,
    desc: '基础树种，适合新手'
  },
  {
    id: 't2',
    name: '垂柳',
    time: 30 * 60,
    xp: 250,
    price: 500,
    levelReq: 5,
    icon: willowTreeImg,
    desc: '优雅的垂柳，经验丰富'
  },
  {
    id: 't3',
    name: '杨树',
    time: 45 * 60,
    xp: 600,
    price: 2500,
    levelReq: 15,
    icon: poplarTreeImg,
    desc: '长得像火炬，有一点'
  },
  {
    id: 't4',
    name: '魔法树',
    time: 60 * 60,
    xp: 1500,
    price: 10000,
    levelReq: 30,
    icon: magicTreeImg,
    desc: '传说中的魔法植物'
  },
  {
    id: 't5',
    name: '金钱树',
    time: 100 * 60,
    xp: 3000,
    price: 50000,
    levelReq: 50,
    icon: goldTreeImg,
    desc: '能收获金钱吗？'
  }
]
