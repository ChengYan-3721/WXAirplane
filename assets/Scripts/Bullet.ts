import {_decorator, Component, Collider2D, Contact2DType, IPhysics2DContact} from 'cc';
import {size} from 'db://assets/Scripts/main';
import {PlayerControl} from "db://assets/Scripts/PlayerControl";

const {ccclass, property} = _decorator;

@ccclass('Bullet')
export class Bullet extends Component {
    @property(String)
    typename: string;

    start() {
        // 获取任意类型的碰撞器实例，可以使用基类
        const collider = this.node.getComponent(Collider2D);
        // 注册单个碰撞体的回调函数
        collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    onBeginContact(){
        // 回收到对象池
        this.scheduleOnce(() => {
            PlayerControl.instance.recycleBullet(this.node, this.typename);
        }, 0)
    }

    update(deltaTime: number) {
        // 出屏幕回收到对象池
        if (this.node.position.y > size.y * (640 / size.x) / 2) {
            PlayerControl.instance.recycleBullet(this.node, this.typename);
        }
    }
}

