/* eslint-disable no-console */

export const registerAutomation = async({
  type,
  file,
  description,
  label,
}: {
  type: string;
  file: string;
  description?: string;
  label?: string;
}): Promise<void> => {
  console.log(`Registering automation for "${type}"...`);
};

export default registerAutomation;
