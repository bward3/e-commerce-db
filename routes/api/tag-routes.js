const router = require('express').Router();
const {
  Tag,
  Product,
  ProductTag,
  Category
} = require('../../models');

// The `/api/tags` endpoint

router.get('/', async (req, res) => {
  // find all tags
  try {
    const tagData = await Tag.findAll({
      include: {
        model: Product,
        include: {
          model: Category
        },
        through: ProductTag
      }
    });
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
  // be sure to include its associated Product data
});

router.get('/:id', async (req, res) => {
  // find a single tag by its `id`
  try {
    const tagData = await Tag.findByPk(req.params.id, {
      include: {
        model: Product,
        include: {
          model: Category
        },
        through: ProductTag
      }
    });
    if (!tagData) {
      res.status(404).json({
        message: 'No product found with that id!'
      });
      return;
    }
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
  // be sure to include its associated Product data
});

router.post('/', async (req, res) => {
  // create a new tag
  try {
    const tagData = await Tag.create(req.body);
    if (req.body.productIds.length) {
      const productTagIdArr = req.body.productIds.map((product_id) => {
        return {
          tag_id: tagData.id,
          product_id,
        }
      });
      await ProductTag.bulkCreate(productTagIdArr);
    }
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/:id', async (req, res) => {
  // update a tag's name by its `id` value\
  try {
    const tagData = await Tag.update(req.body, {
      where: {
        id: req.params.id
      }
    });
    console.log(tagData);
    if (tagData[0] == 0) {
      res.status(500).json({
        message: 'Nothing to update.'
      });
      return;
    }
    if (req.body.productIds) {
      const productTags = await ProductTag.findAll({
        where: {
          tag_id: req.params.id
        }
      });
      const productTagIds = productTags.map(({
        product_id
      }) => product_id);
      const newProductTags = req.body.productIds
        .filter((product_id) => !productTagIds.includes(product_id))
        .map((product_id) => {
          return {
            tag_id: req.params.id,
            product_id
          };
        });
      const productTagsToRemove = productTags.filter(({
          product_id
        }) => !req.body.productIds.includes(product_id))
        .map(({
          id
        }) => id);
      await ProductTag.destroy({
        where: {
          id: productTagsToRemove
        }
      });
      const updatedProductTags = await ProductTag.bulkCreate(newProductTags);
      res.status(200).json(updatedProductTags);
    }
  } catch (err) {
    res.status(500).json(err);
  }

});

router.delete('/:id', async (req, res) => {
  // delete on tag by its `id` value
  try {
    const tagData = await Tag.destroy({
      where: {
        id: req.params.id
      }
    });
    if (!tagData) {
      res.status(404).json({
        message: 'No product with that id.'
      });
      return;
    }
    const productTags = await ProductTag.destroy({
      where: {
        tag_id: req.params.id
      }
    })
    res.status(200).json([tagData, productTags]);

  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;