import {Text} from '@nemesis-oss/termina-core';
import {OrderedList} from '@nemesis-oss/termina-ui';

export default function Plan() {
  return (
    <OrderedList>
      <OrderedList.Item>
        <Text>Install dependencies</Text>
      </OrderedList.Item>

      <OrderedList.Item>
        <Text>Build the packages</Text>

        <OrderedList>
          <OrderedList.Item>
            <Text>Build core</Text>
          </OrderedList.Item>

          <OrderedList.Item>
            <Text>Build ui</Text>
          </OrderedList.Item>
        </OrderedList>
      </OrderedList.Item>

      <OrderedList.Item>
        <Text>Run the tests</Text>
      </OrderedList.Item>
    </OrderedList>
  );
}
