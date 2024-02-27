import Joi from "joi";

interface RegisterLoginData {
  username: string;
  password: string;
}

interface PostData {
  title: string;
  topic: string;
  message: string;
  ownerId: string;
  expiry: string;
}

export const registerValidation = (data: RegisterLoginData) => {
  const schemaValidation = Joi.object({
    username: Joi.string().required().min(4).max(15),
    password: Joi.string().required().min(6).max(1024),
  });
  return schemaValidation.validate(data);
};

export const logInValidation = (data: RegisterLoginData) => {
  const schemaValidation = Joi.object({
    username: Joi.string().required().min(4).max(15),
    password: Joi.string().required().min(6).max(1024),
  });
  return schemaValidation.validate(data);
};

export const postValidation = (data: PostData) => {
  const schemaValidation = Joi.object({
    title: Joi.string().required().min(3).max(12),
    topic: Joi.string()
      .valid("politics", "health", "sport", "tech", "social", "tech")
      .required(),
    message: Joi.string().required().min(10).max(150),
    ownerId: Joi.number().required(),
    expiry: Joi.string().required(),
  });
  return schemaValidation.validate(data);
};
